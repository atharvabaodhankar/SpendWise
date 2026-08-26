import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  String? _error;
  bool _loading = false;

  Future<void> _handleSignup() async {
    if (_passwordController.text != _confirmController.text) {
      setState(() { _error = 'Passwords do not match'; });
      return;
    }
    setState(() { _error = null; _loading = true; });
    try {
      await context.read<AppAuthProvider>().signupWithEmail(
        _emailController.text.trim(),
        _passwordController.text,
      );
      if (mounted) Navigator.pushReplacementNamed(context, '/dashboard');
    } catch (e) {
      setState(() { _error = 'Failed to create account: ${e.toString()}'; });
    }
    setState(() { _loading = false; });
  }

  Future<void> _handleGoogleSignup() async {
    setState(() { _error = null; _loading = true; });
    try {
      await context.read<AppAuthProvider>().loginWithGoogle();
      if (mounted) Navigator.pushReplacementNamed(context, '/dashboard');
    } catch (e) {
      setState(() { _error = 'Failed to sign up with Google: ${e.toString()}'; });
    }
    setState(() { _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 420),
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.hairline),
                boxShadow: [BoxShadow(color: Colors.black.withAlpha(12), blurRadius: 30, offset: const Offset(0, 10))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Logo
                  GestureDetector(
                    onTap: () => Navigator.pushReplacementNamed(context, '/'),
                    child: Row(
                      children: [
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(color: AppTheme.navy, borderRadius: BorderRadius.circular(8)),
                          child: const Center(child: Text('SW', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold))),
                        ),
                        const SizedBox(width: 10),
                        Text('SPENDWISE', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 2, color: AppTheme.navy)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  Text('ACCOUNT REGISTRATION', style: GoogleFonts.jetBrainsMono(fontSize: 10, letterSpacing: 2, color: AppTheme.slateLight, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text('Create your statement account', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w600, color: AppTheme.navy)),

                  const SizedBox(height: 24),

                  // Google button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _loading ? null : _handleGoogleSignup,
                      icon: const Icon(Icons.g_mobiledata, size: 24),
                      label: const Text('Sign up with Google'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  Row(
                    children: [
                      const Expanded(child: Divider()),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text('Or register with email', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.slateLight)),
                      ),
                      const Expanded(child: Divider()),
                    ],
                  ),

                  const SizedBox(height: 20),

                  if (_error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.rose.withAlpha(15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.rose.withAlpha(50)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: AppTheme.rose, size: 18),
                          const SizedBox(width: 10),
                          Expanded(child: Text(_error!, style: GoogleFonts.inter(fontSize: 13, color: AppTheme.rose))),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  Text('Email address', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(hintText: 'you@example.com', prefixIcon: Icon(Icons.mail_outline, size: 20)),
                  ),

                  const SizedBox(height: 16),

                  Text('Password', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(hintText: '••••••••', prefixIcon: Icon(Icons.lock_outline, size: 20)),
                  ),

                  const SizedBox(height: 16),

                  Text('Confirm Password', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.slate)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _confirmController,
                    obscureText: true,
                    decoration: const InputDecoration(hintText: '••••••••', prefixIcon: Icon(Icons.shield_outlined, size: 20)),
                  ),

                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _handleSignup,
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: _loading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [Text('CREATE ACCOUNT'), SizedBox(width: 8), Icon(Icons.arrow_forward, size: 16)],
                            ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  Center(
                    child: GestureDetector(
                      onTap: () => Navigator.pushReplacementNamed(context, '/login'),
                      child: RichText(
                        text: TextSpan(
                          style: GoogleFonts.inter(fontSize: 13, color: AppTheme.slate),
                          children: [
                            const TextSpan(text: 'Already have an account? '),
                            TextSpan(text: 'Sign in', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppTheme.navy)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }
}
