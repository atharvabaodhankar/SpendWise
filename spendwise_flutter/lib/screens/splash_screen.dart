import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.canvas,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Logo
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppTheme.navy,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Center(
                child: Text(
                  'SW',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppTheme.navy,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'LOADING',
              style: TextStyle(
                fontSize: 10,
                letterSpacing: 4,
                fontWeight: FontWeight.w500,
                color: AppTheme.slateLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
