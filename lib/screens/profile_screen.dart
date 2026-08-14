import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/auth_service.dart';
import 'about_screen.dart';
import 'faq_screen.dart';
import 'settings_screen.dart';
import 'sponsor/sponsor_dashboard_screen.dart';
import 'sponsor/sponsor_login_screen.dart';
import 'sponsor/sponsor_promo_screen.dart';
import 'freelancer/freelancer_career_screen.dart';
import 'freelancer/freelancer_dashboard_screen.dart';
import 'watch_history_screen.dart';
import 'watch_later_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _sponsor(BuildContext context) {
    if (AuthService.isLoggedIn) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const SponsorDashboardScreen()));
    } else {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const SponsorLoginScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    final loggedIn = AuthService.isLoggedIn;
    return Scaffold(
      backgroundColor: AppColors.black,
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(16), children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
            child: Row(children: [
              CircleAvatar(radius: 30, backgroundColor: AppColors.red, child: Text(loggedIn ? 'S' : 'G', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white))),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(loggedIn ? (AuthService.email ?? 'Sponsor') : 'Guest Viewer', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
                Text(loggedIn ? 'Sponsor account' : 'Not signed in', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
              ])),
            ]),
          ),
          const SizedBox(height: 12),
          Container(padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.red.withValues(alpha: 0.2))),
            child: const Row(children: [Icon(Icons.favorite, color: AppColors.red, size: 18), SizedBox(width: 10), Expanded(child: Text('Vallavan is free for everyone — supported by sponsors.', style: TextStyle(fontSize: 12, color: Colors.white)))])),
          const SizedBox(height: 20),
          _section('ACCOUNT', [
            _row(context, Icons.history, 'Watch History', const WatchHistoryScreen()),
            _row(context, Icons.bookmark_border, 'Watch Later', const WatchLaterScreen()),
          ]),
          const SizedBox(height: 16),
          _section('SPONSOR', [
            _tile(Icons.star, 'Become a Sponsor', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SponsorPromoScreen())), accent: true),
            _tile(Icons.dashboard, 'Sponsor Dashboard', () => _sponsor(context), accent: true),
          ]),
          const SizedBox(height: 16),
          _section('FREELANCER', [
            _tile(Icons.people, 'Join as Freelancer', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FreelancerCareerScreen())), accent: true),
            _tile(Icons.work_outline, 'Freelancer Dashboard', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FreelancerDashboardScreen())), accent: true),
          ]),
          const SizedBox(height: 16),
          _section('SUPPORT', [
            _row(context, Icons.help_outline, 'Help & Support', const FaqScreen()),
            _row(context, Icons.settings, 'App Settings', const SettingsScreen()),
            _row(context, Icons.info_outline, 'About Vallavan', const AboutScreen()),
          ]),
          const SizedBox(height: 24),
        ]),
      ),
    );
  }

  Widget _section(String title, List<Widget> children) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(padding: const EdgeInsets.only(left: 4, bottom: 8), child: Text(title, style: const TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold))),
        Container(decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(14)), child: Column(children: children)),
      ]);

  Widget _row(BuildContext context, IconData icon, String label, Widget screen) =>
      _tile(icon, label, () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)));

  Widget _tile(IconData icon, String label, VoidCallback onTap, {bool accent = false}) => ListTile(
        leading: Icon(icon, color: accent ? AppColors.gold : AppColors.muted, size: 20),
        title: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.muted, size: 18),
        onTap: onTap,
      );
}
