import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class BudgetWidget extends StatefulWidget {
  final double budgetLimit;
  final double spent;
  final Function(double) onSave;

  const BudgetWidget({
    super.key,
    required this.budgetLimit,
    required this.spent,
    required this.onSave,
  });

  @override
  State<BudgetWidget> createState() => _BudgetWidgetState();
}

class _BudgetWidgetState extends State<BudgetWidget> {
  bool _editing = false;
  final _controller = TextEditingController();

  double get _progress => widget.budgetLimit > 0 ? (widget.spent / widget.budgetLimit * 100) : 0;
  bool get _isOver => _progress > 100;
  double get _remaining => widget.budgetLimit - widget.spent;

  @override
  void initState() {
    super.initState();
    _controller.text = widget.budgetLimit > 0 ? widget.budgetLimit.toStringAsFixed(0) : '';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('MONTHLY BUDGET', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 2, color: AppTheme.slateLight, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(
                    '${DateTime.now().month == 1 ? 'January' : DateTime.now().month == 2 ? 'February' : DateTime.now().month == 3 ? 'March' : DateTime.now().month == 4 ? 'April' : DateTime.now().month == 5 ? 'May' : DateTime.now().month == 6 ? 'June' : DateTime.now().month == 7 ? 'July' : DateTime.now().month == 8 ? 'August' : DateTime.now().month == 9 ? 'September' : DateTime.now().month == 10 ? 'October' : DateTime.now().month == 11 ? 'November' : 'December'} ${DateTime.now().year}',
                    style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary),
                  ),
                ],
              ),
              IconButton(
                icon: Icon(_editing ? Icons.close : Icons.edit, size: 18, color: AppTheme.slateLight),
                onPressed: () => setState(() => _editing = !_editing),
              ),
            ],
          ),

          if (_editing) ...[
            const SizedBox(height: 16),
            Text('Monthly Limit (₹)', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    keyboardType: TextInputType.number,
                    style: GoogleFonts.jetBrainsMono(fontWeight: FontWeight.w600),
                    decoration: const InputDecoration(prefixText: '₹ '),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () {
                    final val = double.tryParse(_controller.text);
                    if (val != null && val > 0) {
                      widget.onSave(val);
                      setState(() => _editing = false);
                    }
                  },
                  child: const Icon(Icons.check, size: 18),
                ),
              ],
            ),
          ] else if (widget.budgetLimit > 0) ...[
            const SizedBox(height: 16),

            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (_progress / 100).clamp(0, 1),
                minHeight: 8,
                backgroundColor: AppTheme.slateFaint,
                valueColor: AlwaysStoppedAnimation(_isOver ? AppTheme.rose : AppTheme.navy),
              ),
            ),

            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('₹0', style: GoogleFonts.jetBrainsMono(fontSize: 10, color: AppTheme.slateLight)),
                Text('₹${widget.budgetLimit.toStringAsFixed(0)}', style: GoogleFonts.jetBrainsMono(fontSize: 10, color: AppTheme.slateLight)),
              ],
            ),

            const SizedBox(height: 16),

            // Stats rows
            _BudgetRow(label: 'Spent', value: '₹${widget.spent.toStringAsFixed(2)}', color: _isOver ? AppTheme.rose : Theme.of(context).colorScheme.primary),
            _BudgetRow(label: 'Limit', value: '₹${widget.budgetLimit.toStringAsFixed(2)}', color: Theme.of(context).colorScheme.primary),
            _BudgetRow(
              label: 'Remaining',
              value: '${_remaining < 0 ? '-' : ''}₹${_remaining.abs().toStringAsFixed(2)}',
              color: _remaining < 0 ? AppTheme.rose : AppTheme.emerald,
            ),

            const SizedBox(height: 16),
            Center(
              child: Column(
                children: [
                  Text(
                    '${_progress.toStringAsFixed(0)}%',
                    style: GoogleFonts.jetBrainsMono(fontSize: 32, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary),
                  ),
                  Text('OF LIMIT USED', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 2, color: AppTheme.slateLight, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 20),
            Center(
              child: Column(
                children: [
                  Icon(Icons.pie_chart, size: 40, color: AppTheme.slateLight),
                  const SizedBox(height: 8),
                  Text('No Budget Set', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary)),
                  const SizedBox(height: 4),
                  Text('Set a monthly limit to track spending.', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.slateLight)),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: () => setState(() => _editing = true),
                    child: const Text('SET BUDGET'),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

class _BudgetRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _BudgetRow({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1, color: AppTheme.slate)),
          const Expanded(child: Divider(indent: 8, endIndent: 8)),
          Text(value, style: GoogleFonts.jetBrainsMono(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}
