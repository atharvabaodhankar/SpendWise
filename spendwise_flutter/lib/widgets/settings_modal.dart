import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../providers/auth_provider.dart';
import '../providers/transactions_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';

class SettingsModal extends StatefulWidget {
  const SettingsModal({super.key});

  @override
  State<SettingsModal> createState() => _SettingsModalState();
}

class _SettingsModalState extends State<SettingsModal> {
  bool _showBalances = true;
  bool _emailAlerts = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final prefs = context.read<TransactionsProvider>().preferences;
    if (prefs != null) {
      _showBalances = prefs['showBalances'] ?? true;
      _emailAlerts = prefs['emailAlerts'] ?? true;
    }
  }

  Future<void> _savePreferences() async {
    final uid = context.read<AppAuthProvider>().user?.uid;
    if (uid == null) return;

    setState(() => _saving = true);
    try {
      await FirebaseFirestore.instance.collection('userPreferences').doc(uid).set({
        'showBalances': _showBalances,
        'emailAlerts': _emailAlerts,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Settings saved successfully!'),
            backgroundColor: AppTheme.emerald,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save settings: $e'), backgroundColor: AppTheme.rose),
        );
      }
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final auth = context.watch<AppAuthProvider>();

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
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
            'PREFERENCES',
            style: GoogleFonts.jetBrainsMono(
              fontSize: 10,
              letterSpacing: 2,
              color: AppTheme.slateLight,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'App Settings',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(height: 20),

          // User Info Box
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.navy,
                  child: Text(auth.initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(auth.displayName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      Text(auth.email, style: GoogleFonts.jetBrainsMono(fontSize: 11, color: AppTheme.slateLight)),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Dark Mode Toggle
          SwitchListTile(
            title: Text('Dark Mode', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500)),
            subtitle: Text('Switch between light and dark statement theme', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.slateLight)),
            value: themeProvider.isDark,
            activeColor: AppTheme.navy,
            onChanged: (val) => themeProvider.toggleTheme(),
            contentPadding: EdgeInsets.zero,
          ),

          const Divider(),

          // Show Balances Toggle
          SwitchListTile(
            title: Text('Show Wallet Balances', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500)),
            subtitle: Text('Display total, online, and cash cards on dashboard', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.slateLight)),
            value: _showBalances,
            activeColor: AppTheme.navy,
            onChanged: (val) => setState(() => _showBalances = val),
            contentPadding: EdgeInsets.zero,
          ),

          const Divider(),

          // Email Alerts Toggle
          SwitchListTile(
            title: Text('Email Budget Alerts', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500)),
            subtitle: Text('Receive notifications on budget threshold breaches', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.slateLight)),
            value: _emailAlerts,
            activeColor: AppTheme.navy,
            onChanged: (val) => setState(() => _emailAlerts = val),
            contentPadding: EdgeInsets.zero,
          ),

          const SizedBox(height: 24),

          // Save Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _saving ? null : _savePreferences,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              child: _saving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('SAVE PREFERENCES'),
            ),
          ),
        ],
      ),
    );
  }
}
