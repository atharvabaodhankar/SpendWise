import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/transactions_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/spendwise_logo.dart';
import '../widgets/balance_cards.dart';
import '../widgets/transaction_list_widget.dart';
import '../widgets/add_transaction_sheet.dart';
import '../widgets/budget_widget.dart';
import '../widgets/ai_chat_sheet.dart';
import '../widgets/initial_balance_setup.dart';
import '../widgets/balance_manager_modal.dart';
import '../widgets/friends_modal.dart';
import '../widgets/settings_modal.dart';
import '../utils/export_utils.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  void _showExportDialog(BuildContext context, TransactionsProvider txProvider) {
    final summary = ExportUtils.generateLedgerSummary(
      transactions: txProvider.transactions,
      totalBalance: txProvider.totalBalance,
      onlineBalance: txProvider.onlineBalance,
      cashBalance: txProvider.cashBalance,
    );

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Export Statement', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        content: SingleChildScrollView(
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.navy,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              summary,
              style: GoogleFonts.jetBrainsMono(fontSize: 10, color: Colors.white),
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          ElevatedButton.icon(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: summary));
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Statement copied to clipboard!'), backgroundColor: AppTheme.emerald),
              );
            },
            icon: const Icon(Icons.copy, size: 16),
            label: const Text('COPY STATEMENT'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AppAuthProvider>();
    final txProvider = context.watch<TransactionsProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

    if (txProvider.isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(strokeWidth: 2, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 16),
              Text('LOADING', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 4, color: AppTheme.slateLight)),
            ],
          ),
        ),
      );
    }

    if (txProvider.needsInitialSetup) {
      return InitialBalanceSetupWidget(
        onComplete: (online, cash) => txProvider.setupInitialBalances(online, cash),
      );
    }

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── App Bar ──
            SliverAppBar(
              pinned: true,
              automaticallyImplyLeading: false,
              title: Row(
                children: [
                  const SpendWiseLogo(size: 32),
                  const SizedBox(width: 10),
                  Text('SpendWise', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary)),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.people_outline, size: 20),
                  tooltip: 'Friends & Splits',
                  onPressed: () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    useSafeArea: true,
                    builder: (context) => const FriendsModal(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.bar_chart_rounded, size: 20),
                  tooltip: 'Analytics',
                  onPressed: () => Navigator.pushNamed(context, '/analytics'),
                ),
                IconButton(
                  icon: Icon(themeProvider.isDark ? Icons.wb_sunny_outlined : Icons.dark_mode_outlined, size: 20),
                  tooltip: 'Toggle Theme',
                  onPressed: () => themeProvider.toggleTheme(),
                ),
                PopupMenuButton<String>(
                  icon: CircleAvatar(
                    radius: 14,
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    child: Text(auth.initials, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                  onSelected: (value) {
                    if (value == 'settings') {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        builder: (context) => const SettingsModal(),
                      );
                    } else if (value == 'export') {
                      _showExportDialog(context, txProvider);
                    } else if (value == 'logout') {
                      auth.logout();
                      Navigator.pushReplacementNamed(context, '/');
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      enabled: false,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(auth.displayName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary)),
                          Text(auth.email, style: GoogleFonts.jetBrainsMono(fontSize: 11, color: AppTheme.slateLight)),
                        ],
                      ),
                    ),
                    const PopupMenuDivider(),
                    const PopupMenuItem(value: 'settings', child: Row(children: [Icon(Icons.settings_outlined, size: 18), SizedBox(width: 8), Text('Settings')])),
                    const PopupMenuItem(value: 'export', child: Row(children: [Icon(Icons.download_outlined, size: 18), SizedBox(width: 8), Text('Export Ledger')])),
                    const PopupMenuDivider(),
                    const PopupMenuItem(value: 'logout', child: Row(children: [Icon(Icons.logout, size: 18, color: AppTheme.rose), SizedBox(width: 8), Text('Logout', style: TextStyle(color: AppTheme.rose))])),
                  ],
                ),
                const SizedBox(width: 8),
              ],
            ),

            // ── Content ──
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Greeting + Export button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${_greeting()}, ${auth.displayName.split(' ')[0]}',
                            style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${txProvider.transactions.length} transactions · ${txProvider.uniqueCategories} categories',
                            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.slateLight),
                          ),
                        ],
                      ),
                      OutlinedButton.icon(
                        onPressed: () => _showExportDialog(context, txProvider),
                        icon: const Icon(Icons.download, size: 14),
                        label: const Text('EXPORT'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Balance cards — tapping opens balance manager modal
                  if (txProvider.showBalances) ...[
                    GestureDetector(
                      onTap: () => showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        builder: (context) => const BalanceManagerModal(),
                      ),
                      child: BalanceCards(
                        totalBalance: txProvider.totalBalance,
                        onlineBalance: txProvider.onlineBalance,
                        cashBalance: txProvider.cashBalance,
                        currencyFmt: currencyFmt,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // This month stats
                  Row(
                    children: [
                      Expanded(child: _StatChip(
                        icon: Icons.arrow_downward,
                        iconColor: AppTheme.emerald,
                        label: 'THIS MONTH INCOME',
                        value: '+${currencyFmt.format(txProvider.thisMonthIncome)}',
                        valueColor: AppTheme.emerald,
                      )),
                      const SizedBox(width: 8),
                      Expanded(child: _StatChip(
                        icon: Icons.arrow_upward,
                        iconColor: AppTheme.rose,
                        label: 'THIS MONTH SPENT',
                        value: '−${currencyFmt.format(txProvider.thisMonthExpenses)}',
                        valueColor: AppTheme.rose,
                      )),
                    ],
                  ),

                  const SizedBox(height: 8),

                  _StatChip(
                    icon: Icons.trending_down,
                    iconColor: AppTheme.slate,
                    label: 'ALL-TIME OUTLAY',
                    value: currencyFmt.format(txProvider.totalExpenses),
                    valueColor: Theme.of(context).colorScheme.primary,
                  ),

                  const SizedBox(height: 24),

                  // Budget widget
                  BudgetWidget(
                    budgetLimit: txProvider.budgetLimit,
                    spent: txProvider.thisMonthExpenses,
                    onSave: (limit) => txProvider.saveBudget(limit),
                  ),

                  const SizedBox(height: 24),

                  // Transactions header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('RECENT TRANSACTIONS', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 1, color: Theme.of(context).colorScheme.primary)),
                          Text('${txProvider.transactions.length} total records', style: GoogleFonts.jetBrainsMono(fontSize: 11, color: AppTheme.slateLight)),
                        ],
                      ),
                      TextButton(
                        onPressed: () => Navigator.pushNamed(context, '/analytics'),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Analytics', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.slateLight)),
                            const Icon(Icons.chevron_right, size: 16, color: AppTheme.slateLight),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Transaction list
                  TransactionListWidget(
                    transactions: txProvider.transactions,
                    onDelete: (tx) => txProvider.deleteTransaction(tx.id),
                    currencyFmt: currencyFmt,
                  ),

                  const SizedBox(height: 100), // Space for FAB
                ]),
              ),
            ),
          ],
        ),
      ),

      // FAB — AI chat + add expense
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // AI chat FAB
          FloatingActionButton.small(
            heroTag: 'ai_chat',
            onPressed: () => showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              useSafeArea: true,
              builder: (context) => const AiChatSheet(),
            ),
            backgroundColor: Theme.of(context).cardColor,
            child: const SpendWiseLogo(size: 24, showBackground: false),
          ),
          const SizedBox(height: 12),
          // Add transaction FAB
          FloatingActionButton(
            heroTag: 'add_tx',
            onPressed: () => showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              useSafeArea: true,
              builder: (context) => const AddTransactionSheet(),
            ),
            backgroundColor: AppTheme.navy,
            child: const Icon(Icons.add, color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;
  final Color valueColor;

  const _StatChip({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    required this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: iconColor.withAlpha(25), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.jetBrainsMono(fontSize: 9, letterSpacing: 1.5, color: AppTheme.slateLight, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(value, style: GoogleFonts.jetBrainsMono(fontSize: 15, fontWeight: FontWeight.w700, color: valueColor)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
