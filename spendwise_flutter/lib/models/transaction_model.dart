import 'package:cloud_firestore/cloud_firestore.dart';

class TransactionModel {
  final String id;
  final String userId;
  final String type; // 'expense' or 'income'
  final double amount;
  final double? totalPaid;
  final String category;
  final String description;
  final String date; // YYYY-MM-DD
  final String paymentMethod; // 'online', 'cash', 'owed'
  final bool affectCurrentBalance;
  final bool isSplit;
  final bool isBalanceAdjustment;
  final DateTime? createdAt;

  TransactionModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.amount,
    this.totalPaid,
    required this.category,
    this.description = '',
    required this.date,
    this.paymentMethod = 'online',
    this.affectCurrentBalance = true,
    this.isSplit = false,
    this.isBalanceAdjustment = false,
    this.createdAt,
  });

  factory TransactionModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return TransactionModel(
      id: doc.id,
      userId: data['userId'] ?? '',
      type: data['type'] ?? 'expense',
      amount: (data['amount'] ?? 0).toDouble(),
      totalPaid: data['totalPaid']?.toDouble(),
      category: data['category'] ?? 'Other',
      description: data['description'] ?? '',
      date: _normalizeDate(data['date']),
      paymentMethod: data['paymentMethod'] ?? 'online',
      affectCurrentBalance: data['affectCurrentBalance'] ?? true,
      isSplit: data['isSplit'] ?? false,
      isBalanceAdjustment: data['isBalanceAdjustment'] ?? false,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'type': type,
      'amount': amount,
      if (totalPaid != null) 'totalPaid': totalPaid,
      'category': category,
      'description': description,
      'date': date,
      'paymentMethod': paymentMethod,
      'affectCurrentBalance': affectCurrentBalance,
      'isSplit': isSplit,
      'isBalanceAdjustment': isBalanceAdjustment,
      'createdAt': FieldValue.serverTimestamp(),
    };
  }

  bool get isExpense => type == 'expense';
  bool get isIncome => type == 'income';

  static String _normalizeDate(dynamic dateValue) {
    if (dateValue == null) return DateTime.now().toIso8601String().substring(0, 10);
    if (dateValue is String) return dateValue;
    if (dateValue is Timestamp) return dateValue.toDate().toIso8601String().substring(0, 10);
    return DateTime.now().toIso8601String().substring(0, 10);
  }
}
