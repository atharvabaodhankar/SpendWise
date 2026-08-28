import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/transactions_provider.dart';
import '../services/ai_chat_service.dart';
import '../theme/app_theme.dart';

class AiChatSheet extends StatefulWidget {
  const AiChatSheet({super.key});

  @override
  State<AiChatSheet> createState() => _AiChatSheetState();
}

class _AiChatSheetState extends State<AiChatSheet> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _sending = false;
  final List<Map<String, dynamic>> _messages = [
    {
      'role': 'assistant',
      'content': 'I\'m connected to your SpendWise data. Ask me about your spending, budgets, or tell me to add/edit records.',
      'highlights': ['Live Firebase', 'Budget aware', 'Can edit records'],
    }
  ];

  final _suggestions = [
    'What are my top spending categories?',
    'Add ₹60 for vadapaav in cash',
    'How much did I spend this month?',
  ];

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty || _sending) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text.trim()});
      _sending = true;
    });
    _controller.clear();
    _scrollToBottom();

    try {
      final txProvider = context.read<TransactionsProvider>();

      // Build minimal context
      final context_ = {
        'generatedAt': DateTime.now().toIso8601String(),
        'metrics': {
          'transactionCount': txProvider.transactions.length,
          'totalExpenses': txProvider.totalExpenses,
          'currentMonthTotal': txProvider.thisMonthExpenses,
        },
        'balances': {
          'online': txProvider.onlineBalance,
          'cash': txProvider.cashBalance,
          'total': txProvider.totalBalance,
        },
        'budget': txProvider.budgetLimit > 0 ? {'monthlyLimit': txProvider.budgetLimit} : null,
        'recentTransactions': txProvider.transactions.take(20).map((t) => {
          'id': t.id,
          'type': t.type,
          'amount': t.amount,
          'category': t.category,
          'description': t.description,
          'date': t.date,
          'paymentMethod': t.paymentMethod,
        }).toList(),
      };

      final conversation = _messages
          .where((m) => m['role'] == 'user' || m['role'] == 'assistant')
          .map((m) => {'role': m['role'] as String, 'content': m['content'] as String})
          .toList();

      final response = await AiChatService.sendMessage(
        message: text.trim(),
        conversation: conversation,
        context: context_,
      );

      setState(() {
        _messages.add({
          'role': 'assistant',
          'content': response['reply'] ?? 'No response',
          'highlights': response['highlights'] ?? [],
          'followUps': response['followUps'] ?? [],
        });
      });
    } catch (e) {
      setState(() {
        _messages.add({'role': 'error', 'content': e.toString()});
      });
    }

    setState(() { _sending = false; });
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, sheetScroll) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle + Header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Column(
                  children: [
                    Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.slateFaint, borderRadius: BorderRadius.circular(2)))),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Container(
                          width: 28, height: 28,
                          decoration: BoxDecoration(color: AppTheme.navy, borderRadius: BorderRadius.circular(7)),
                          child: const Center(child: Text('AI', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold))),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('SPENDWISE AI', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 2, color: AppTheme.navy, fontWeight: FontWeight.w700)),
                              Row(
                                children: [
                                  Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppTheme.emerald, shape: BoxShape.circle)),
                                  const SizedBox(width: 6),
                                  Text('Live Firebase context', style: GoogleFonts.jetBrainsMono(fontSize: 10, color: AppTheme.slateLight)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 18),
                          color: AppTheme.slateLight,
                          onPressed: () => setState(() {
                            _messages.clear();
                            _messages.add({
                              'role': 'assistant',
                              'content': 'Conversation cleared. How can I help?',
                              'highlights': ['Fresh start'],
                            });
                          }),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const Divider(height: 24),

              // Suggestions
              SizedBox(
                height: 32,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: _suggestions.map((s) => Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ActionChip(
                      label: Text(s, style: GoogleFonts.inter(fontSize: 11)),
                      onPressed: () => _sendMessage(s),
                      side: BorderSide(color: Theme.of(context).dividerColor),
                      backgroundColor: Theme.of(context).cardColor,
                    ),
                  )).toList(),
                ),
              ),

              const SizedBox(height: 8),

              // Messages
              Expanded(
                child: ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: _messages.length + (_sending ? 1 : 0),
                  itemBuilder: (context, i) {
                    if (i == _messages.length && _sending) {
                      // Typing indicator
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            Container(
                              width: 24, height: 24,
                              decoration: BoxDecoration(color: AppTheme.navy, borderRadius: BorderRadius.circular(6)),
                              child: const Center(child: Text('AI', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold))),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(10), border: Border.all(color: Theme.of(context).dividerColor)),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: List.generate(3, (j) => TweenAnimationBuilder<double>(
                                  tween: Tween(begin: 0, end: 1),
                                  duration: Duration(milliseconds: 600 + j * 150),
                                  builder: (_, val, __) => Container(
                                    width: 6, height: 6,
                                    margin: const EdgeInsets.symmetric(horizontal: 2),
                                    decoration: BoxDecoration(color: AppTheme.navy.withAlpha((val * 255).toInt()), shape: BoxShape.circle),
                                  ),
                                )),
                              ),
                            ),
                          ],
                        ),
                      );
                    }

                    final msg = _messages[i];
                    final isUser = msg['role'] == 'user';
                    final isError = msg['role'] == 'error';

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                        children: [
                          if (!isUser) ...[
                            Container(
                              width: 24, height: 24,
                              decoration: BoxDecoration(color: AppTheme.navy, borderRadius: BorderRadius.circular(6)),
                              child: const Center(child: Text('AI', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold))),
                            ),
                            const SizedBox(width: 8),
                          ],
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isUser
                                    ? AppTheme.navy
                                    : isError
                                        ? AppTheme.rose.withAlpha(15)
                                        : Theme.of(context).cardColor,
                                borderRadius: BorderRadius.circular(12),
                                border: isUser ? null : Border.all(color: isError ? AppTheme.rose.withAlpha(50) : Theme.of(context).dividerColor),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    msg['content'] ?? '',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: isUser ? Colors.white : isError ? AppTheme.rose : Theme.of(context).colorScheme.primary,
                                      height: 1.5,
                                    ),
                                  ),
                                  if (msg['highlights'] != null && (msg['highlights'] as List).isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 4,
                                      runSpacing: 4,
                                      children: (msg['highlights'] as List).map((h) => Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          border: Border.all(color: Theme.of(context).dividerColor),
                                          borderRadius: BorderRadius.circular(100),
                                        ),
                                        child: Text(h, style: GoogleFonts.jetBrainsMono(fontSize: 9, color: AppTheme.slate)),
                                      )).toList(),
                                    ),
                                  ],
                                  if (msg['followUps'] != null && (msg['followUps'] as List).isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 4,
                                      runSpacing: 4,
                                      children: (msg['followUps'] as List).map((f) => ActionChip(
                                        label: Text(f, style: GoogleFonts.inter(fontSize: 10)),
                                        onPressed: () => _sendMessage(f),
                                        side: BorderSide(color: Theme.of(context).dividerColor),
                                        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                                      )).toList(),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Input
              Container(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
                ),
                child: SafeArea(
                  top: false,
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          onSubmitted: _sendMessage,
                          decoration: InputDecoration(
                            hintText: 'Ask AI or type a command...',
                            hintStyle: GoogleFonts.inter(fontSize: 13, color: AppTheme.slateLight),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                          maxLines: 3,
                          minLines: 1,
                          style: GoogleFonts.inter(fontSize: 13),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _sending ? null : () => _sendMessage(_controller.text),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.all(12),
                          minimumSize: const Size(44, 44),
                        ),
                        child: const Icon(Icons.send, size: 18),
                      ),
                    ],
                  ),
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
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
