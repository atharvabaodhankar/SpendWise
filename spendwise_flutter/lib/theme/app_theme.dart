import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// SpendWise Statement/Passbook theme — matching the web app design system.
class AppTheme {
  // ── Brand Colors ──
  static const navy = Color(0xFF0F172A);
  static const navyMuted = Color(0xFF1E293B);
  static const slate = Color(0xFF475569);
  static const slateLight = Color(0xFF94A3B8);
  static const slateFaint = Color(0xFFE2E8F0);
  static const canvas = Color(0xFFF9FAFB);
  static const white = Color(0xFFFFFFFF);
  static const emerald = Color(0xFF10B981);
  static const emeraldDark = Color(0xFF065F46);
  static const rose = Color(0xFFE11D48);
  static const roseDark = Color(0xFF9F1239);
  static const hairline = Color(0x140F172A); // 8% opacity navy

  // Dark theme colors
  static const darkCanvas = Color(0xFF090D16);
  static const darkWhite = Color(0xFF0F172A);
  static const darkNavy = Color(0xFFF8FAFC);
  static const darkNavyMuted = Color(0xFFE2E8F0);
  static const darkSlate = Color(0xFF94A3B8);
  static const darkSlateLight = Color(0xFF64748B);
  static const darkSlateFaint = Color(0xFF1E293B);
  static const darkHairline = Color(0x1AFFFFFF); // 10% opacity white

  static TextTheme _buildTextTheme(TextTheme base) {
    return GoogleFonts.interTextTheme(base).copyWith(
      headlineLarge: GoogleFonts.inter(fontWeight: FontWeight.w600, letterSpacing: -0.5),
      headlineMedium: GoogleFonts.inter(fontWeight: FontWeight.w600, letterSpacing: -0.3),
      headlineSmall: GoogleFonts.inter(fontWeight: FontWeight.w600, letterSpacing: -0.2),
      titleLarge: GoogleFonts.inter(fontWeight: FontWeight.w600),
      titleMedium: GoogleFonts.inter(fontWeight: FontWeight.w600),
      titleSmall: GoogleFonts.inter(fontWeight: FontWeight.w600),
      bodyLarge: GoogleFonts.inter(),
      bodyMedium: GoogleFonts.inter(),
      bodySmall: GoogleFonts.inter(),
      labelLarge: GoogleFonts.jetBrainsMono(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.5),
      labelMedium: GoogleFonts.jetBrainsMono(fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 1.5),
      labelSmall: GoogleFonts.jetBrainsMono(fontSize: 9, fontWeight: FontWeight.w600, letterSpacing: 2),
    );
  }

  static ThemeData get lightTheme {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      colorScheme: ColorScheme.light(
        primary: navy,
        onPrimary: white,
        secondary: emerald,
        onSecondary: white,
        surface: white,
        onSurface: navy,
        error: rose,
        onError: white,
        outline: slateFaint,
      ),
      scaffoldBackgroundColor: canvas,
      appBarTheme: AppBarTheme(
        backgroundColor: white.withAlpha(230),
        foregroundColor: navy,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: navy,
          letterSpacing: -0.2,
        ),
      ),
      cardTheme: CardThemeData(
        color: white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: hairline),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: navy,
          foregroundColor: canvas,
          elevation: 2,
          shadowColor: navy.withAlpha(40),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.5),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: slate,
          side: BorderSide(color: slateFaint),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.5),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: slateFaint),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: slateFaint),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: navy, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        labelStyle: GoogleFonts.jetBrainsMono(fontSize: 10, fontWeight: FontWeight.w600, color: slateLight, letterSpacing: 1.5),
        hintStyle: GoogleFonts.inter(fontSize: 14, color: slateLight),
      ),
      dividerTheme: DividerThemeData(color: hairline, thickness: 1),
      textTheme: _buildTextTheme(base.textTheme),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: white,
        selectedItemColor: navy,
        unselectedItemColor: slateLight,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }

  static ThemeData get darkTheme {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      colorScheme: ColorScheme.dark(
        primary: darkNavy,
        onPrimary: darkCanvas,
        secondary: emerald,
        onSecondary: darkCanvas,
        surface: darkWhite,
        onSurface: darkNavy,
        error: Color(0xFFFB7185),
        onError: darkCanvas,
        outline: darkSlateFaint,
      ),
      scaffoldBackgroundColor: darkCanvas,
      appBarTheme: AppBarTheme(
        backgroundColor: darkWhite.withAlpha(230),
        foregroundColor: darkNavy,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: darkNavy,
          letterSpacing: -0.2,
        ),
      ),
      cardTheme: CardThemeData(
        color: darkWhite,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: darkHairline),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: darkNavy,
          foregroundColor: darkCanvas,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.5),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: darkSlate,
          side: BorderSide(color: darkSlateFaint),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.5),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkWhite,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: darkSlateFaint),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: darkSlateFaint),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: darkNavy, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: GoogleFonts.inter(fontSize: 14, color: darkSlateLight),
      ),
      dividerTheme: DividerThemeData(color: darkHairline, thickness: 1),
      textTheme: _buildTextTheme(base.textTheme),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: darkWhite,
        selectedItemColor: darkNavy,
        unselectedItemColor: darkSlateLight,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }
}
