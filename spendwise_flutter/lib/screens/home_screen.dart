import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../widgets/spendwise_logo.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // ── Navbar ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SpendWiseLogo(size: 32),
                        const SizedBox(width: 8),
                        Text(
                          'SPENDWISE',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.5,
                            color: AppTheme.navy,
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/login'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      ),
                      child: const Text('SIGN IN'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // ── Hero Section ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Stamp pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.hairline),
                        borderRadius: BorderRadius.circular(100),
                        color: Theme.of(context).cardColor,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6, height: 6,
                            decoration: const BoxDecoration(color: AppTheme.emerald, shape: BoxShape.circle),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'SPENDWISE PASSBOOK EDITION',
                            style: GoogleFonts.jetBrainsMono(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 2,
                              color: AppTheme.navy,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    Text(
                      'Personal Expense\nTracking,',
                      style: GoogleFonts.inter(
                        fontSize: 36,
                        fontWeight: FontWeight.w600,
                        height: 1.15,
                        letterSpacing: -0.5,
                        color: AppTheme.navy,
                      ),
                    ),
                    Text(
                      'Redefined as a Statement.',
                      style: GoogleFonts.inter(
                        fontSize: 36,
                        fontWeight: FontWeight.w600,
                        height: 1.15,
                        letterSpacing: -0.5,
                        color: AppTheme.slateLight,
                      ),
                    ),

                    const SizedBox(height: 20),

                    Text(
                      'Track daily outlays, split bills with friends, and monitor your monthly budget with a clean, high-precision expense tracker.',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        color: AppTheme.slate,
                        height: 1.6,
                      ),
                    ),

                    const SizedBox(height: 28),

                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => Navigator.pushNamed(context, '/signup'),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            icon: const Icon(Icons.arrow_forward, size: 18),
                            label: const Text('START YOUR LEDGER'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pushNamed(context, '/login'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: const Text('SIGN IN'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 48),

              // ── Statement Preview Card ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.hairline),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 30, offset: const Offset(0, 10)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Card header
                      Row(
                        children: [
                          Container(
                            width: 32, height: 32,
                            decoration: BoxDecoration(color: AppTheme.navy, borderRadius: BorderRadius.circular(8)),
                            child: const Center(child: Text('SW', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold))),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('SPENDWISE STATEMENT', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: AppTheme.navy)),
                                Text('AUGUST 2026 PASSBOOK', style: GoogleFonts.jetBrainsMono(fontSize: 10, color: AppTheme.slateLight)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 32),

                      // Balance
                      Text('CUMULATIVE OUTLAY', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 2, color: AppTheme.slateLight, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Text('₹63,962.67', style: GoogleFonts.jetBrainsMono(fontSize: 32, fontWeight: FontWeight.w600, color: AppTheme.navy)),

                      const SizedBox(height: 20),

                      // Sample ledger rows
                      _buildLedgerRow('25 MAY', 'Anjeer and jamun', '−₹110.00'),
                      _buildLedgerRow('25 MAY', 'Vadapaav and bhaje', '−₹60.00'),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 48),

              // ── Features Section ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    Text('HIGH-PRECISION TOOLS', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 2, color: AppTheme.slateLight, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text(
                      'Empowering Features for Modern Finances',
                      style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w600, color: AppTheme.navy, letterSpacing: -0.3),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    _buildFeatureCard(Icons.account_balance_wallet, 'Dual Balance Tracking', 'Track cash and digital wallets in one unified view.'),
                    const SizedBox(height: 12),
                    _buildFeatureCard(Icons.people, 'Social Expense Splitting', 'Split bills instantly with friends and track debts.'),
                    const SizedBox(height: 12),
                    _buildFeatureCard(Icons.pie_chart, 'Intelligent Analytics', 'Visualize spending habits with interactive charts.'),
                    const SizedBox(height: 12),
                    _buildFeatureCard(Icons.notifications, 'Smart Alerts', 'Low balance, large transaction, and budget alerts.'),
                    const SizedBox(height: 12),
                    _buildFeatureCard(Icons.smart_toy, 'AI Finance Copilot', 'Chat with AI about your spending data.'),
                    const SizedBox(height: 12),
                    _buildFeatureCard(Icons.sync, 'Real-time Sync', 'Instant updates across web and mobile.'),
                  ],
                ),
              ),

              const SizedBox(height: 48),

              // ── CTA ──
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
                color: AppTheme.navy,
                child: Column(
                  children: [
                    Text('INSTANT SETUP', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 2, color: AppTheme.emerald, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Text(
                      'Ready to Transform\nYour Finances?',
                      style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w600, color: Colors.white, letterSpacing: -0.3),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/signup'),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppTheme.navy),
                      child: const Text('GET STARTED NOW'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // ── Footer ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Text(
                  '© 2026 SpendWise Inc. All rights reserved.',
                  style: GoogleFonts.jetBrainsMono(fontSize: 11, color: AppTheme.slateLight),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLedgerRow(String date, String desc, String amount) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Text(date, style: GoogleFonts.jetBrainsMono(fontSize: 10, color: AppTheme.slateLight)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              desc,
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.navy),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Text(amount, style: GoogleFonts.jetBrainsMono(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.rose)),
        ],
      ),
    );
  }

  Widget _buildFeatureCard(IconData icon, String title, String desc) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.hairline),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(color: AppTheme.navy, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.navy)),
                const SizedBox(height: 4),
                Text(desc, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.slate, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
