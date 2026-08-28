import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/transactions_provider.dart';
import '../theme/app_theme.dart';

const _chartColors = [
  Color(0xFF10B981), Color(0xFF6366F1), Color(0xFFF59E0B), Color(0xFFF43F5E),
  Color(0xFF8B5CF6), Color(0xFFEC4899), Color(0xFF06B6D4), Color(0xFF3B82F6),
];

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final txProvider = context.watch<TransactionsProvider>();
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);
    final transactions = txProvider.transactions;
    final expenses = transactions.where((t) => t.isExpense).toList();

    // Category breakdown
    final Map<String, double> categoryTotals = {};
    for (final t in expenses) {
      categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + t.amount;
    }
    final sortedCategories = categoryTotals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final totalExpenses = sortedCategories.fold(0.0, (sum, e) => sum + e.value);

    // Monthly trend
    final Map<String, double> monthlyTotals = {};
    for (final t in expenses) {
      final month = t.date.substring(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] ?? 0) + t.amount;
    }
    final sortedMonths = monthlyTotals.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.pop(context),
              ),
              title: Text('Analytics', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            ),

            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (expenses.isEmpty) ...[
                    const SizedBox(height: 80),
                    Center(
                      child: Column(
                        children: [
                          Icon(Icons.bar_chart, size: 48, color: AppTheme.slateLight),
                          const SizedBox(height: 12),
                          Text('No data to analyze', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.navy)),
                          Text('Start recording expenses to see analytics.', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.slateLight)),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Summary cards
                    Row(
                      children: [
                        Expanded(child: _SummaryCard(label: 'TOTAL OUTLAYS', value: currencyFmt.format(totalExpenses))),
                        const SizedBox(width: 8),
                        Expanded(child: _SummaryCard(label: 'CATEGORIES', value: '${categoryTotals.length}')),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: _SummaryCard(
                          label: 'AVG / CATEGORY',
                          value: currencyFmt.format(categoryTotals.isNotEmpty ? totalExpenses / categoryTotals.length : 0),
                        )),
                        const SizedBox(width: 8),
                        Expanded(child: _SummaryCard(
                          label: 'TOP CATEGORY',
                          value: sortedCategories.isNotEmpty ? sortedCategories.first.key : '—',
                        )),
                      ],
                    ),

                    const SizedBox(height: 28),

                    // ── Pie Chart ──
                    _SectionHeader(title: 'EXPENSE BREAKDOWN', subtitle: 'Distribution across categories'),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Theme.of(context).dividerColor),
                      ),
                      child: Column(
                        children: [
                          SizedBox(
                            height: 220,
                            child: PieChart(
                              PieChartData(
                                sectionsSpace: 3,
                                centerSpaceRadius: 45,
                                sections: sortedCategories.asMap().entries.map((entry) {
                                  final i = entry.key;
                                  final cat = entry.value;
                                  return PieChartSectionData(
                                    color: _chartColors[i % _chartColors.length],
                                    value: cat.value,
                                    title: '${(cat.value / totalExpenses * 100).toStringAsFixed(0)}%',
                                    titleStyle: GoogleFonts.jetBrainsMono(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                                    radius: 55,
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          // Legend
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: sortedCategories.asMap().entries.map((entry) {
                              final i = entry.key;
                              final cat = entry.value;
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).scaffoldBackgroundColor,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: Theme.of(context).dividerColor),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(width: 8, height: 8, decoration: BoxDecoration(color: _chartColors[i % _chartColors.length], shape: BoxShape.circle)),
                                    const SizedBox(width: 6),
                                    Text(cat.key, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.slate)),
                                    const SizedBox(width: 6),
                                    Text('${(cat.value / totalExpenses * 100).toStringAsFixed(0)}%', style: GoogleFonts.jetBrainsMono(fontSize: 10, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    // ── Bar Chart ──
                    _SectionHeader(title: 'MONTHLY SPENDING', subtitle: 'Historical spending timeline'),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(20),
                      height: 280,
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Theme.of(context).dividerColor),
                      ),
                      child: BarChart(
                        BarChartData(
                          alignment: BarChartAlignment.spaceAround,
                          maxY: (sortedMonths.map((e) => e.value).fold(0.0, (a, b) => a > b ? a : b)) * 1.2,
                          gridData: FlGridData(
                            show: true,
                            drawVerticalLine: false,
                            getDrawingHorizontalLine: (value) => FlLine(color: Theme.of(context).dividerColor, strokeWidth: 1),
                          ),
                          borderData: FlBorderData(show: false),
                          titlesData: FlTitlesData(
                            leftTitles: AxisTitles(sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 48,
                              getTitlesWidget: (value, meta) => Text('₹${(value / 1000).toStringAsFixed(0)}k', style: GoogleFonts.jetBrainsMono(fontSize: 9, color: AppTheme.slateLight)),
                            )),
                            bottomTitles: AxisTitles(sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                final i = value.toInt();
                                if (i >= 0 && i < sortedMonths.length) {
                                  final parts = sortedMonths[i].key.split('-');
                                  final monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: Text(monthNames[int.parse(parts[1])], style: GoogleFonts.inter(fontSize: 10, color: AppTheme.slateLight)),
                                  );
                                }
                                return const SizedBox.shrink();
                              },
                            )),
                            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          ),
                          barGroups: sortedMonths.asMap().entries.map((entry) {
                            return BarChartGroupData(
                              x: entry.key,
                              barRods: [BarChartRodData(
                                toY: entry.value.value,
                                color: AppTheme.emerald,
                                width: 20,
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                              )],
                            );
                          }).toList(),
                        ),
                      ),
                    ),

                    const SizedBox(height: 28),

                    // ── Category Table ──
                    _SectionHeader(title: 'CATEGORY DETAILS', subtitle: 'Detailed breakdown'),
                    const SizedBox(height: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Theme.of(context).dividerColor),
                      ),
                      child: Column(
                        children: sortedCategories.asMap().entries.map((entry) {
                          final i = entry.key;
                          final cat = entry.value;
                          final pct = totalExpenses > 0 ? (cat.value / totalExpenses * 100) : 0.0;
                          return Column(
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                child: Row(
                                  children: [
                                    Container(width: 10, height: 10, decoration: BoxDecoration(color: _chartColors[i % _chartColors.length], shape: BoxShape.circle)),
                                    const SizedBox(width: 10),
                                    Expanded(child: Text(cat.key, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary))),
                                    Text(currencyFmt.format(cat.value), style: GoogleFonts.jetBrainsMono(fontSize: 12, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary)),
                                    const SizedBox(width: 12),
                                    SizedBox(
                                      width: 44,
                                      child: Text('${pct.toStringAsFixed(1)}%', style: GoogleFonts.jetBrainsMono(fontSize: 11, color: AppTheme.slateLight), textAlign: TextAlign.right),
                                    ),
                                  ],
                                ),
                              ),
                              if (i < sortedCategories.length - 1) Divider(height: 1, color: Theme.of(context).dividerColor),
                            ],
                          );
                        }).toList(),
                      ),
                    ),

                    const SizedBox(height: 60),
                  ],
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  const _SummaryCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.jetBrainsMono(fontSize: 9, letterSpacing: 1.5, color: AppTheme.slateLight, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(value, style: GoogleFonts.jetBrainsMono(fontSize: 18, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.primary), overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  const _SectionHeader({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 1, color: Theme.of(context).colorScheme.primary)),
        Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.slateLight)),
      ],
    );
  }
}
