import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../models/transaction_model.dart';
import '../theme/app_theme.dart';

class TransactionListWidget extends StatelessWidget {
  final List<TransactionModel> transactions;
  final Function(TransactionModel) onDelete;
  final NumberFormat currencyFmt;

  const TransactionListWidget({
    super.key,
    required this.transactions,
    required this.onDelete,
    required this.currencyFmt,
  });

  @override
  Widget build(BuildContext context) {
    if (transactions.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.trending_up, size: 36, color: AppTheme.slateLight),
            const SizedBox(height: 12),
            Text('No transactions recorded', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary)),
            const SizedBox(height: 4),
            Text('Add your first entry to start your ledger.', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.slateLight)),
          ],
        ),
      );
    }

    // Show first 20 transactions
    final displayed = transactions.take(20).toList();

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: displayed.length,
        separatorBuilder: (_, __) => Divider(height: 1, color: Theme.of(context).dividerColor, indent: 16, endIndent: 16),
        itemBuilder: (context, index) {
          final tx = displayed[index];
          final dateObj = DateTime.tryParse(tx.date);
          final dateStr = dateObj != null
              ? '${dateObj.day.toString().padLeft(2, '0')} ${DateFormat.MMM().format(dateObj).toUpperCase()}'
              : tx.date;

          return Dismissible(
            key: Key(tx.id),
            direction: DismissDirection.endToStart,
            background: Container(
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 20),
              color: AppTheme.rose.withAlpha(25),
              child: const Icon(Icons.delete_outline, color: AppTheme.rose),
            ),
            confirmDismiss: (direction) async {
              return await showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Delete Transaction'),
                  content: Text('Delete "${tx.description.isNotEmpty ? tx.description : tx.category}"?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Delete', style: TextStyle(color: AppTheme.rose)),
                    ),
                  ],
                ),
              );
            },
            onDismissed: (_) => onDelete(tx),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  // Date
                  SizedBox(
                    width: 48,
                    child: Text(dateStr, style: GoogleFonts.jetBrainsMono(fontSize: 10, color: AppTheme.slateLight)),
                  ),
                  const SizedBox(width: 12),

                  // Description + Category
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tx.description.isNotEmpty ? tx.description : tx.category,
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          tx.category,
                          style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 1, color: AppTheme.slateLight),
                        ),
                      ],
                    ),
                  ),

                  // Amount
                  Text(
                    '${tx.isIncome ? '+' : '−'}${currencyFmt.format(tx.amount)}',
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: tx.isIncome ? AppTheme.emerald : AppTheme.rose,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
