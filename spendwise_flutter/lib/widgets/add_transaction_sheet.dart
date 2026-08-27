import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../providers/transactions_provider.dart';
import '../theme/app_theme.dart';

class AddTransactionSheet extends StatefulWidget {
  const AddTransactionSheet({super.key});

  @override
  State<AddTransactionSheet> createState() => _AddTransactionSheetState();
}

class _AddTransactionSheetState extends State<AddTransactionSheet> {
  String _type = 'expense';
  final _amountController = TextEditingController();
  final _descController = TextEditingController();
  String _category = 'Food & Dining';
  String _paymentMethod = 'online';
  DateTime _date = DateTime.now();
  bool _affectBalance = true;
  bool _loading = false;

  static const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Groceries',
    'Travel', 'Personal Care', 'Gifts & Donations', 'Other',
  ];

  Future<void> _submit() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount'), backgroundColor: AppTheme.rose),
      );
      return;
    }

    setState(() { _loading = true; });

    try {
      await context.read<TransactionsProvider>().addTransaction(
        type: _type,
        amount: amount,
        category: _category,
        description: _descController.text.trim(),
        date: DateFormat('yyyy-MM-dd').format(_date),
        paymentMethod: _paymentMethod,
        affectCurrentBalance: _affectBalance,
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${_type == 'expense' ? 'Expense' : 'Income'} added!'), backgroundColor: AppTheme.emerald),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.rose),
        );
      }
    }

    setState(() { _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(20),
            children: [
              // Handle
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.slateFaint, borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),

              // Header
              Text('ADD RECORD', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 2, color: AppTheme.slateLight, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text('New Transaction', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary)),
              const SizedBox(height: 24),

              // Type toggle
              Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Row(
                  children: [
                    Expanded(child: _TypeButton(label: 'Expense', active: _type == 'expense', onTap: () => setState(() => _type = 'expense'), color: AppTheme.rose)),
                    Expanded(child: _TypeButton(label: 'Income', active: _type == 'income', onTap: () => setState(() => _type = 'income'), color: AppTheme.emerald)),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Amount
              Text('Amount (₹)', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
              const SizedBox(height: 6),
              TextField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                style: GoogleFonts.jetBrainsMono(fontSize: 24, fontWeight: FontWeight.w700),
                decoration: const InputDecoration(hintText: '0.00', prefixText: '₹ '),
                autofocus: true,
              ),

              const SizedBox(height: 16),

              // Description
              Text('Description', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
              const SizedBox(height: 6),
              TextField(
                controller: _descController,
                decoration: const InputDecoration(hintText: 'e.g., Vadapaav and chai'),
              ),

              const SizedBox(height: 16),

              // Category dropdown
              Text('Category', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _category,
                items: categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (v) => setState(() => _category = v!),
                decoration: const InputDecoration(),
              ),

              const SizedBox(height: 16),

              // Payment method
              Text('Payment Method', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(child: _MethodButton(label: 'Online', icon: Icons.credit_card, active: _paymentMethod == 'online', onTap: () => setState(() => _paymentMethod = 'online'))),
                  const SizedBox(width: 8),
                  Expanded(child: _MethodButton(label: 'Cash', icon: Icons.account_balance_wallet, active: _paymentMethod == 'cash', onTap: () => setState(() => _paymentMethod = 'cash'))),
                ],
              ),

              const SizedBox(height: 16),

              // Date picker
              Text('Date', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
              const SizedBox(height: 6),
              GestureDetector(
                onTap: () async {
                  final picked = await showDatePicker(context: context, initialDate: _date, firstDate: DateTime(2020), lastDate: DateTime.now());
                  if (picked != null) setState(() => _date = picked);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppTheme.slateFaint),
                    borderRadius: BorderRadius.circular(8),
                    color: Theme.of(context).cardColor,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(DateFormat('dd MMMM yyyy').format(_date), style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.primary)),
                      const Icon(Icons.calendar_today, size: 16, color: AppTheme.slateLight),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Affect balance toggle
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Affect Current Balance', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
                      Text('Deduct/add from your wallet', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.slateLight)),
                    ],
                  ),
                  Switch(value: _affectBalance, onChanged: (v) => setState(() => _affectBalance = v), activeColor: AppTheme.navy),
                ],
              ),

              const SizedBox(height: 28),

              // Submit
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: _loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text('ADD ${_type.toUpperCase()}'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descController.dispose();
    super.dispose();
  }
}

class _TypeButton extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  final Color color;
  const _TypeButton({required this.label, required this.active, required this.onTap, required this.color});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active ? color.withAlpha(25) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: active ? color : AppTheme.slateLight)),
        ),
      ),
    );
  }
}

class _MethodButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;
  const _MethodButton({required this.label, required this.icon, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active ? Theme.of(context).colorScheme.primary.withAlpha(15) : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: active ? Theme.of(context).colorScheme.primary.withAlpha(100) : Theme.of(context).dividerColor),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: active ? Theme.of(context).colorScheme.primary : AppTheme.slateLight),
            const SizedBox(width: 6),
            Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: active ? Theme.of(context).colorScheme.primary : AppTheme.slateLight)),
          ],
        ),
      ),
    );
  }
}
