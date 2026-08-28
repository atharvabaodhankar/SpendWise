import 'package:intl/intl.dart';
import '../models/transaction_model.dart';

class ExportUtils {
  static String generateLedgerSummary({
    required List<TransactionModel> transactions,
    required double totalBalance,
    required double onlineBalance,
    required double cashBalance,
  }) {
    final buffer = StringBuffer();
    final fmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);
    final dateFmt = DateFormat('yyyy-MM-dd HH:mm');

    buffer.writeln('========================================');
    buffer.writeln('          SPENDWISE STATEMENT           ');
    buffer.writeln('========================================');
    buffer.writeln('Generated on: ${dateFmt.format(DateTime.now())}');
    buffer.writeln('Total Balance:  ${fmt.format(totalBalance)}');
    buffer.writeln('Online Balance: ${fmt.format(onlineBalance)}');
    buffer.writeln('Cash Balance:   ${fmt.format(cashBalance)}');
    buffer.writeln('----------------------------------------');
    buffer.writeln('DATE        | TYPE    | AMOUNT     | CATEGORY / DESC');
    buffer.writeln('----------------------------------------');

    for (final tx in transactions) {
      final typeStr = tx.isIncome ? '[IN]' : '[EX]';
      final amtStr = fmt.format(tx.amount).padLeft(10);
      final desc = tx.description.isNotEmpty ? tx.description : tx.category;
      buffer.writeln('${tx.date} | $typeStr | $amtStr | $desc (${tx.paymentMethod})');
    }

    buffer.writeln('========================================');
    buffer.writeln('Total Records: ${transactions.length}');
    buffer.writeln('========================================');

    return buffer.toString();
  }

  static String generateCsv({required List<TransactionModel> transactions}) {
    final buffer = StringBuffer();
    buffer.writeln('ID,Date,Type,Amount,Category,Description,PaymentMethod');

    for (final tx in transactions) {
      final desc = tx.description.replaceAll(',', ' ');
      final cat = tx.category.replaceAll(',', ' ');
      buffer.writeln('${tx.id},${tx.date},${tx.type},${tx.amount},$cat,$desc,${tx.paymentMethod}');
    }

    return buffer.toString();
  }
}
