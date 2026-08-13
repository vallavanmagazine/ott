import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Palette mirrored from the web app's tailwind.config.js.
class AppColors {
  static const black = Color(0xFF0A0A0A); // vblack — background
  static const red = Color(0xFFD32F2F); // vred — primary/accent
  static const redLight = Color(0xFFE53935);
  static const gold = Color(0xFFD4AF37); // vgold — badge/premium
  static const dark = Color(0xFF141414); // vdark — cards/surfaces
  static const muted = Color(0xFFA0A0A0); // vmuted — secondary text
  static const glass = Color(0x14FFFFFF); // rgba(255,255,255,0.08)
  static const glassStrong = Color(0x1FFFFFFF);
}

/// Genre → accent colour (from mockData.genreColors).
const Map<String, Color> genreColors = {
  'Environment': Color(0xFF2E7D32),
  'Wildlife': Color(0xFF6D4C41),
  'History': Color(0xFF8D6E63),
  'Science': Color(0xFF1565C0),
  'Society': Color(0xFF6A1B9A),
  'Investigation': Color(0xFFC62828),
  'Education': Color(0xFF00838F),
  'Culture': Color(0xFFAD1457),
  'Motivation': Color(0xFFEF6C00),
  'Success Stories': Color(0xFFF9A825),
  'Life Lessons': Color(0xFF00897B),
  'Changemakers': Color(0xFF283593),
  'Youth Voices': Color(0xFFE53935),
};

Color genreColor(String g) => genreColors[g] ?? const Color(0xFF666666);

ThemeData buildTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: AppColors.black,
    colorScheme: base.colorScheme.copyWith(
      primary: AppColors.red,
      secondary: AppColors.gold,
      surface: AppColors.dark,
    ),
    textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: Colors.white,
      displayColor: Colors.white,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.black,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    dividerColor: const Color(0x14FFFFFF),
  );
}

/// Tamil text style helper (Noto Sans Tamil).
TextStyle tamilStyle({double size = 12, Color color = AppColors.muted, FontWeight weight = FontWeight.w500}) =>
    GoogleFonts.notoSansTamil(fontSize: size, color: color, fontWeight: weight);
