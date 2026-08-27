import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';

class BalanceCards extends StatelessWidget {
  final double totalBalance;
  final double onlineBalance;
  final double cashBalance;
  final NumberFormat currencyFmt;

  const BalanceCards({
    super.key,
    required this.totalBalance,
    required this.onlineBalance,
    required this.cashBalance,
    required this.currencyFmt,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Total balance card — dark gradient
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(25),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.show_chart, color: Colors.white, size: 18),
                  ),
                  const Icon(Icons.chevron_right, color: Colors.white38, size: 20),
                ],
              ),
              const SizedBox(height: 12),
              Text('TOTAL BALANCE', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 2, color: Colors.white38, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(
                currencyFmt.format(totalBalance),
                style: GoogleFonts.jetBrainsMono(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white),
              ),
            ],
          ),
        ),

        const SizedBox(height: 10),

        // Online + Cash row
        Row(
          children: [
            Expanded(child: _SmallBalanceCard(
              icon: Icons.credit_card,
              iconColor: Colors.blue,
              label: 'ONLINE',
              value: currencyFmt.format(onlineBalance),
              context: context,
            )),
            const SizedBox(width: 10),
            Expanded(child: _SmallBalanceCard(
              icon: Icons.account_balance_wallet,
              iconColor: AppTheme.emerald,
              label: 'CASH',
              value: currencyFmt.format(cashBalance),
              context: context,
            )),
          ],
        ),
      ],
    );
  }
}

class _SmallBalanceCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;
  final BuildContext context;

  const _SmallBalanceCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    required this.context,
  });

  @override
  Widget build(BuildContext _) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: iconColor.withAlpha(25),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: iconColor),
          ),
          const SizedBox(height: 10),
          Text(label, style: GoogleFonts.jetBrainsMono(fontSize: 9, letterSpacing: 2, color: AppTheme.slateLight, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(value, style: GoogleFonts.jetBrainsMono(fontSize: 18, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.primary)),
        ],
      ),
    );
  }
}
