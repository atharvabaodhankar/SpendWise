import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class InitialBalanceSetupWidget extends StatefulWidget {
  final Function(double online, double cash) onComplete;

  const InitialBalanceSetupWidget({super.key, required this.onComplete});

  @override
  State<InitialBalanceSetupWidget> createState() => _InitialBalanceSetupWidgetState();
}

class _InitialBalanceSetupWidgetState extends State<InitialBalanceSetupWidget> {
  final _onlineController = TextEditingController(text: '0');
  final _cashController = TextEditingController(text: '0');
  bool _loading = false;

  Future<void> _submit() async {
    final online = double.tryParse(_onlineController.text) ?? 0;
    final cash = double.tryParse(_cashController.text) ?? 0;

    setState(() { _loading = true; });
    try {
      await widget.onComplete(online, cash);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.rose),
        );
      }
    }
    if (mounted) setState(() { _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 420),
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.hairline),
                boxShadow: [BoxShadow(color: Colors.black.withAlpha(12), blurRadius: 30, offset: const Offset(0, 10))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: AppTheme.navy, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.account_balance_wallet, color: Colors.white, size: 24),
                  ),

                  const SizedBox(height: 20),

                  Text('INITIAL SETUP', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 2, color: AppTheme.slateLight, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text('Set Your Starting Balances', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w600, color: AppTheme.navy)),
                  const SizedBox(height: 8),
                  Text(
                    'Enter your current online and cash balances to get started.',
                    style: GoogleFonts.inter(fontSize: 14, color: AppTheme.slate, height: 1.5),
                  ),

                  const SizedBox(height: 28),

                  // Online balance
                  Text('Online Balance (₹)', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _onlineController,
                    keyboardType: TextInputType.number,
                    style: GoogleFonts.jetBrainsMono(fontSize: 18, fontWeight: FontWeight.w600),
                    decoration: const InputDecoration(
                      prefixText: '₹ ',
                      prefixIcon: Icon(Icons.credit_card, size: 20),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Cash balance
                  Text('Cash Balance (₹)', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _cashController,
                    keyboardType: TextInputType.number,
                    style: GoogleFonts.jetBrainsMono(fontSize: 18, fontWeight: FontWeight.w600),
                    decoration: const InputDecoration(
                      prefixText: '₹ ',
                      prefixIcon: Icon(Icons.account_balance_wallet, size: 20),
                    ),
                  ),

                  const SizedBox(height: 28),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: _loading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [Text('START YOUR LEDGER'), SizedBox(width: 8), Icon(Icons.arrow_forward, size: 16)],
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
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
