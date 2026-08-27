import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/transactions_provider.dart';
import '../theme/app_theme.dart';

class BalanceManagerModal extends StatefulWidget {
  const BalanceManagerModal({super.key});

  @override
  State<BalanceManagerModal> createState() => _BalanceManagerModalState();
}

class _BalanceManagerModalState extends State<BalanceManagerModal> {
  final _onlineController = TextEditingController();
  final _cashController = TextEditingController();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final txProvider = context.read<TransactionsProvider>();
    _onlineController.text = txProvider.onlineBalance.toStringAsFixed(2);
    _cashController.text = txProvider.cashBalance.toStringAsFixed(2);
  }

  Future<void> _handleSave() async {
    final online = double.tryParse(_onlineController.text) ?? 0;
    final cash = double.tryParse(_cashController.text) ?? 0;

    setState(() => _isSaving = true);

    try {
      await context.read<TransactionsProvider>().setupInitialBalances(online, cash);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Balances updated successfully!'),
            backgroundColor: AppTheme.emerald,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update balances: $e'), backgroundColor: AppTheme.rose),
        );
      }
    }

    if (mounted) setState(() => _isSaving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.slateFaint,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'WALLET MANAGEMENT',
            style: GoogleFonts.jetBrainsMono(
              fontSize: 10,
              letterSpacing: 2,
              color: AppTheme.slateLight,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Adjust Wallet Balances',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Online Balance (₹)',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppTheme.slate,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _onlineController,
            keyboardType: TextInputType.number,
            style: GoogleFonts.jetBrainsMono(fontSize: 16, fontWeight: FontWeight.w600),
            decoration: const InputDecoration(
              prefixText: '₹ ',
              prefixIcon: Icon(Icons.credit_card, size: 20),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Cash Balance (₹)',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppTheme.slate,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _cashController,
            keyboardType: TextInputType.number,
            style: GoogleFonts.jetBrainsMono(fontSize: 16, fontWeight: FontWeight.w600),
            decoration: const InputDecoration(
              prefixText: '₹ ',
              prefixIcon: Icon(Icons.account_balance_wallet, size: 20),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _handleSave,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              child: _isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('SAVE BALANCES'),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _onlineController.dispose();
    _cashController.dispose();
    super.dispose();
  }
}
