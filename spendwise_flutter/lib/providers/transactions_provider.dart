import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/transaction_model.dart';

class TransactionsProvider extends ChangeNotifier {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  String? _userId;
  List<TransactionModel> _transactions = [];
  Map<String, dynamic>? _balances;
  Map<String, dynamic>? _budget;
  Map<String, dynamic>? _preferences;
  bool _isLoading = true;
  bool _needsInitialSetup = false;

  StreamSubscription? _txSub;
  StreamSubscription? _balSub;
  StreamSubscription? _budSub;
  StreamSubscription? _prefSub;

  // Getters
  List<TransactionModel> get transactions => _transactions;
  Map<String, dynamic>? get balances => _balances;
  Map<String, dynamic>? get budget => _budget;
  Map<String, dynamic>? get preferences => _preferences;
  bool get isLoading => _isLoading;
  bool get needsInitialSetup => _needsInitialSetup;
  bool get showBalances => _preferences?['showBalances'] ?? true;

  double get onlineBalance => (_balances?['online'] ?? 0).toDouble();
  double get cashBalance => (_balances?['cash'] ?? 0).toDouble();
  double get totalBalance => onlineBalance + cashBalance;

  double get totalExpenses => _transactions
      .where((t) => t.isExpense)
      .fold(0.0, (acc, t) => acc + t.amount);

  double get totalIncome => _transactions
      .where((t) => t.isIncome)
      .fold(0.0, (acc, t) => acc + t.amount);

  String get _currentMonth => DateTime.now().toIso8601String().substring(0, 7);

  double get thisMonthExpenses => _transactions
      .where((t) => t.isExpense && t.date.startsWith(_currentMonth))
      .fold(0.0, (acc, t) => acc + t.amount);

  double get thisMonthIncome => _transactions
      .where((t) => t.isIncome && t.date.startsWith(_currentMonth))
      .fold(0.0, (acc, t) => acc + t.amount);

  int get uniqueCategories =>
      _transactions.map((t) => t.category).toSet().length;

  double get budgetLimit => (_budget?['monthlyLimit'] ?? 0).toDouble();
  double get budgetProgress =>
      budgetLimit > 0 ? (thisMonthExpenses / budgetLimit) * 100 : 0;
  double get budgetRemaining => budgetLimit - thisMonthExpenses;

  void setUserId(String? uid) {
    if (_userId == uid) return;
    _userId = uid;
    _cancelSubscriptions();

    if (uid == null) {
      _transactions = [];
      _balances = null;
      _budget = null;
      _preferences = null;
      _isLoading = false;
      _needsInitialSetup = false;
      notifyListeners();
      return;
    }

    _isLoading = true;
    notifyListeners();
    _subscribeToData();
  }

  void _subscribeToData() {
    final uid = _userId;
    if (uid == null) return;

    // Transactions
    _txSub = _db
        .collection('transactions')
        .where('userId', isEqualTo: uid)
        .orderBy('date', descending: true)
        .snapshots()
        .listen((snapshot) {
      _transactions = snapshot.docs
          .map((doc) => TransactionModel.fromFirestore(doc))
          .toList();
      _isLoading = false;
      notifyListeners();
    });

    // Balances
    _balSub = _db
        .collection('currentBalances')
        .doc(uid)
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        _balances = snapshot.data();
        _needsInitialSetup = false;
      } else {
        _balances = null;
        _needsInitialSetup = true;
      }
      notifyListeners();
    });

    // Budget
    _budSub = _db
        .collection('budgets')
        .doc(uid)
        .snapshots()
        .listen((snapshot) {
      _budget = snapshot.exists ? snapshot.data() : null;
      notifyListeners();
    });

    // Preferences
    _prefSub = _db
        .collection('userPreferences')
        .doc(uid)
        .snapshots()
        .listen((snapshot) {
      _preferences = snapshot.exists ? snapshot.data() : {'showBalances': true};
      notifyListeners();
    });
  }

  // ── CRUD Operations ──

  Future<void> addTransaction({
    required String type,
    required double amount,
    required String category,
    String description = '',
    required String date,
    String paymentMethod = 'online',
    bool affectCurrentBalance = true,
  }) async {
    final uid = _userId;
    if (uid == null) return;

    await _db.collection('transactions').add({
      'userId': uid,
      'type': type,
      'amount': amount,
      'category': category,
      'description': description,
      'date': date,
      'paymentMethod': paymentMethod,
      'affectCurrentBalance': affectCurrentBalance,
      'isSplit': false,
      'isBalanceAdjustment': false,
      'createdAt': FieldValue.serverTimestamp(),
    });

    // Update balance if needed
    if (affectCurrentBalance && _balances != null) {
      final delta = type == 'expense' ? -amount : amount;
      final updated = {
        ..._balances!,
        paymentMethod: (_balances![paymentMethod] ?? 0).toDouble() + delta,
        'lastUpdated': FieldValue.serverTimestamp(),
        'updatedBy': 'transaction_add',
      };
      await _db.collection('currentBalances').doc(uid).set(updated);
    }
  }

  Future<void> deleteTransaction(String transactionId) async {
    await _db.collection('transactions').doc(transactionId).delete();
  }

  Future<void> setupInitialBalances(double online, double cash) async {
    final uid = _userId;
    if (uid == null) return;

    await _db.collection('currentBalances').doc(uid).set({
      'online': online,
      'cash': cash,
      'lastUpdated': FieldValue.serverTimestamp(),
      'updatedBy': 'initial_setup',
    });
  }

  Future<void> saveBudget(double monthlyLimit) async {
    final uid = _userId;
    if (uid == null) return;

    await _db.collection('budgets').doc(uid).set({
      'monthlyLimit': monthlyLimit,
      'userId': uid,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  void _cancelSubscriptions() {
    _txSub?.cancel();
    _balSub?.cancel();
    _budSub?.cancel();
    _prefSub?.cancel();
  }

  @override
  void dispose() {
    _cancelSubscriptions();
    super.dispose();
  }
}
