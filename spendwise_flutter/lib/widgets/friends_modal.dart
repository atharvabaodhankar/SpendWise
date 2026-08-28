import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class FriendsModal extends StatefulWidget {
  const FriendsModal({super.key});

  @override
  State<FriendsModal> createState() => _FriendsModalState();
}

class _FriendsModalState extends State<FriendsModal> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _emailSearchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _emailSearchController.dispose();
    super.dispose();
  }

  void _showAddFriendDialog() {
    showDialog(
      context: context,
      builder: (ctx) {
        final emailCtrl = TextEditingController();
        bool loading = false;

        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text('Add Friend', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Enter friend\'s registered email address:', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.slate)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      hintText: 'friend@example.com',
                      prefixIcon: Icon(Icons.mail_outline, size: 20),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: loading
                      ? null
                      : () async {
                          final email = emailCtrl.text.trim().toLowerCase();
                          if (email.isEmpty) return;

                          setDialogState(() => loading = true);
                          final currentUid = context.read<AppAuthProvider>().user?.uid;
                          final currentEmail = context.read<AppAuthProvider>().email;
                          final currentName = context.read<AppAuthProvider>().displayName;

                          try {
                            // Find user by email
                            final userQuery = await FirebaseFirestore.instance
                                .collection('users')
                                .where('email', isEqualTo: email)
                                .get();

                            if (userQuery.docs.isEmpty) {
                              throw 'No user found with that email.';
                            }

                            final friendDoc = userQuery.docs.first;
                            final friendId = friendDoc.id;

                            if (friendId == currentUid) {
                              throw 'You cannot add yourself.';
                            }

                            // Send friend request
                            await FirebaseFirestore.instance
                                .collection('users')
                                .doc(friendId)
                                .collection('friendRequests')
                                .doc(currentUid)
                                .set({
                              'senderId': currentUid,
                              'senderEmail': currentEmail,
                              'senderName': currentName,
                              'createdAt': FieldValue.serverTimestamp(),
                              'status': 'pending',
                            });

                            if (ctx.mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Friend request sent!'),
                                  backgroundColor: AppTheme.emerald,
                                ),
                              );
                            }
                          } catch (e) {
                            if (ctx.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('$e'), backgroundColor: AppTheme.rose),
                              );
                            }
                          }
                          setDialogState(() => loading = false);
                        },
                  child: loading
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('SEND REQUEST'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentUid = context.watch<AppAuthProvider>().user?.uid;

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
          child: Column(
            children: [
              // Handle
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.slateFaint,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),

              // Top Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'SOCIAL & BILL SPLITS',
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 10,
                            letterSpacing: 2,
                            color: AppTheme.slateLight,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          'Friends & Debts',
                          style: GoogleFonts.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton.icon(
                      onPressed: _showAddFriendDialog,
                      icon: const Icon(Icons.person_add, size: 16),
                      label: const Text('ADD'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                    ),
                  ],
                ),
              ),

              // Tab bar
              TabBar(
                controller: _tabController,
                indicatorColor: AppTheme.navy,
                labelColor: AppTheme.navy,
                unselectedLabelColor: AppTheme.slateLight,
                labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
                tabs: const [
                  Tab(text: 'My Friends'),
                  Tab(text: 'Requests'),
                  Tab(text: 'Debts'),
                ],
              ),

              // Tab views
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _FriendsListTab(currentUid: currentUid),
                    _FriendRequestsTab(currentUid: currentUid),
                    _DebtsTab(currentUid: currentUid),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ── Tab 1: Friends List ──
class _FriendsListTab extends StatelessWidget {
  final String? currentUid;
  const _FriendsListTab({required this.currentUid});

  @override
  Widget build(BuildContext context) {
    if (currentUid == null) return const SizedBox.shrink();

    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(currentUid)
          .collection('friends')
          .orderBy('createdAt', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.people_outline, size: 40, color: AppTheme.slateLight),
                const SizedBox(height: 8),
                Text('No friends added yet', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.slateLight)),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: docs.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final data = docs[index].data() as Map<String, dynamic>;
            final name = data['displayName'] ?? data['email'] ?? 'Friend';
            final email = data['email'] ?? '';

            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppTheme.navy,
                    child: Text(
                      name.substring(0, name.length >= 2 ? 2 : name.length).toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary)),
                        if (email.isNotEmpty)
                          Text(email, style: GoogleFonts.jetBrainsMono(fontSize: 11, color: AppTheme.slateLight)),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

// ── Tab 2: Requests ──
class _FriendRequestsTab extends StatelessWidget {
  final String? currentUid;
  const _FriendRequestsTab({required this.currentUid});

  @override
  Widget build(BuildContext context) {
    if (currentUid == null) return const SizedBox.shrink();

    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(currentUid)
          .collection('friendRequests')
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.inbox_outlined, size: 40, color: AppTheme.slateLight),
                const SizedBox(height: 8),
                Text('No pending requests', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.slateLight)),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: docs.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final doc = docs[index];
            final data = doc.data() as Map<String, dynamic>;
            final senderId = data['senderId'] ?? doc.id;
            final senderName = data['senderName'] ?? data['senderEmail'] ?? 'User';
            final senderEmail = data['senderEmail'] ?? '';

            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppTheme.navy,
                    child: Text(senderName.substring(0, 1).toUpperCase(), style: const TextStyle(color: Colors.white)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(senderName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                        Text(senderEmail, style: GoogleFonts.jetBrainsMono(fontSize: 11, color: AppTheme.slateLight)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.check, color: AppTheme.emerald),
                    onPressed: () async {
                      // Add to friends for both users
                      final batch = FirebaseFirestore.instance.batch();
                      final myFriendRef = FirebaseFirestore.instance
                          .collection('users')
                          .doc(currentUid)
                          .collection('friends')
                          .doc(senderId);
                      final theirFriendRef = FirebaseFirestore.instance
                          .collection('users')
                          .doc(senderId)
                          .collection('friends')
                          .doc(currentUid);
                      final requestRef = FirebaseFirestore.instance
                          .collection('users')
                          .doc(currentUid)
                          .collection('friendRequests')
                          .doc(doc.id);

                      batch.set(myFriendRef, {
                        'friendId': senderId,
                        'email': senderEmail,
                        'displayName': senderName,
                        'createdAt': FieldValue.serverTimestamp(),
                      });
                      batch.set(theirFriendRef, {
                        'friendId': currentUid,
                        'email': context.read<AppAuthProvider>().email,
                        'displayName': context.read<AppAuthProvider>().displayName,
                        'createdAt': FieldValue.serverTimestamp(),
                      });
                      batch.delete(requestRef);
                      await batch.commit();
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppTheme.rose),
                    onPressed: () async {
                      await FirebaseFirestore.instance
                          .collection('users')
                          .doc(currentUid)
                          .collection('friendRequests')
                          .doc(doc.id)
                          .delete();
                    },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

// ── Tab 3: Debts ──
class _DebtsTab extends StatelessWidget {
  final String? currentUid;
  const _DebtsTab({required this.currentUid});

  @override
  Widget build(BuildContext context) {
    if (currentUid == null) return const SizedBox.shrink();

    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('debts')
          .where(Filter.or(
            Filter('debtorId', isEqualTo: currentUid),
            Filter('creditorId', isEqualTo: currentUid),
          ))
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle_outline, size: 40, color: AppTheme.emerald),
                const SizedBox(height: 8),
                Text('All settled up! No active debts.', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.slateLight)),
              ],
            ),
          );
        }

        final youOwe = docs.where((d) => (d.data() as Map)['debtorId'] == currentUid).toList();
        final owedToYou = docs.where((d) => (d.data() as Map)['creditorId'] == currentUid).toList();

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (youOwe.isNotEmpty) ...[
              Text('YOU OWE', style: GoogleFonts.jetBrainsMono(fontSize: 11, letterSpacing: 1.5, color: AppTheme.rose, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...youOwe.map((doc) {
                final d = doc.data() as Map<String, dynamic>;
                final amount = (d['amount'] ?? 0).toDouble();
                final desc = d['description'] ?? 'Split expense';
                final status = d['status'] ?? 'unpaid';

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(desc, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                          Text('₹${amount.toStringAsFixed(2)}', style: GoogleFonts.jetBrainsMono(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.rose)),
                        ],
                      ),
                      if (status == 'pending_confirmation')
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: Colors.amber.withAlpha(25), borderRadius: BorderRadius.circular(6)),
                          child: Text('Pending', style: GoogleFonts.inter(fontSize: 12, color: Colors.amber.shade800, fontWeight: FontWeight.w600)),
                        )
                      else
                        ElevatedButton(
                          onPressed: () async {
                            await FirebaseFirestore.instance.collection('debts').doc(doc.id).update({
                              'status': 'pending_confirmation',
                            });
                          },
                          style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                          child: const Text('MARK PAID'),
                        ),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 16),
            ],

            if (owedToYou.isNotEmpty) ...[
              Text('OWED TO YOU', style: GoogleFonts.jetBrainsMono(fontSize: 11, letterSpacing: 1.5, color: AppTheme.emerald, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...owedToYou.map((doc) {
                final d = doc.data() as Map<String, dynamic>;
                final amount = (d['amount'] ?? 0).toDouble();
                final desc = d['description'] ?? 'Split expense';
                final status = d['status'] ?? 'unpaid';

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(desc, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                          Text('₹${amount.toStringAsFixed(2)}', style: GoogleFonts.jetBrainsMono(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.emerald)),
                        ],
                      ),
                      if (status == 'pending_confirmation')
                        ElevatedButton(
                          onPressed: () async {
                            await FirebaseFirestore.instance.collection('debts').doc(doc.id).delete();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.emerald,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                          child: const Text('CONFIRM'),
                        )
                      else
                        Text('Awaiting', style: GoogleFonts.jetBrainsMono(fontSize: 11, color: AppTheme.slateLight)),
                    ],
                  ),
                );
              }),
            ],
          ],
        );
      },
    );
  }
}
