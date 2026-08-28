import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/auth_phone_service.dart';
import 'about_screen.dart';
import 'ai_chatbot_screen.dart';
import 'freelancer/freelancer_career_screen.dart';
import 'freelancer/freelancer_dashboard_screen.dart';
import 'settings_screen.dart';
import 'sponsor/sponsor_dashboard_screen.dart';
import 'sponsor/sponsor_login_screen.dart';
import 'sponsor/sponsor_promo_screen.dart';
import 'watch_history_screen.dart';
import 'watch_later_screen.dart';

/// Tab 3 — Profile. Dashboard entries are shown only for the role the current
/// phone session actually holds; everyone else sees the join/pricing route.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  PhoneSession? _session;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final s = await AuthPhone.currentSession();
    if (mounted) setState(() { _session = s; _loading = false; });
  }

  /// Pushes a screen and re-reads the session on return, so signing in or out
  /// inside a dashboard is reflected here immediately.
  Future<void> _push(Widget screen) async {
    await Navigator.push(context, MaterialPageRoute<void>(builder: (_) => screen));
    if (mounted) _refresh();
  }

  Future<void> _logout() async {
    await AuthPhone.logout();
    if (mounted) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: AppColors.black,
        body: Center(child: CircularProgressIndicator(color: AppColors.red)),
      );
    }

    final s = _session;
    final isSponsor = s?.isSponsor ?? false;
    final isFreelancer = s != null && !isSponsor;

    return Scaffold(
      backgroundColor: AppColors.black,
      body: ListView(padding: const EdgeInsets.all(16), children: [
        _identityCard(s),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.glass,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.red.withValues(alpha: 0.2)),
          ),
          child: const Row(children: [
            Icon(Icons.favorite, color: AppColors.red, size: 18),
            SizedBox(width: 10),
            Expanded(
              child: Text('Vallavan is free for everyone — supported by sponsors.',
                  style: TextStyle(fontSize: 12, color: Colors.white)),
            ),
          ]),
        ),
        const SizedBox(height: 22),
        _section('ACCOUNT', [
          _tile(Icons.history, 'Watch History', () => _push(const WatchHistoryScreen())),
          _tile(Icons.bookmark_border, 'Watch Later', () => _push(const WatchLaterScreen())),
          _tile(Icons.settings_outlined, 'App Settings', () => _push(const SettingsScreen())),
        ]),
        const SizedBox(height: 18),
        _section('SPONSOR', [
          _tile(Icons.star_outline, 'Become a Sponsor',
              () => _push(const SponsorPromoScreen()), accent: true),
          if (isSponsor)
            _tile(Icons.dashboard_outlined, 'Sponsor Dashboard',
                () => _push(const SponsorDashboardScreen()), accent: true),
        ]),
        const SizedBox(height: 18),
        _section('FREELANCER', [
          _tile(Icons.people_outline, 'Join as Freelancer',
              () => _push(const FreelancerCareerScreen()), accent: true),
          if (isFreelancer)
            _tile(Icons.work_outline, 'Freelancer Dashboard',
                () => _push(const FreelancerDashboardScreen()), accent: true),
        ]),
        const SizedBox(height: 18),
        _section('SUPPORT', [
          _tile(Icons.smart_toy_outlined, 'AI Assistant',
              () => _push(AIChatbotScreen(
                    variant: isSponsor ? 'sponsor' : (isFreelancer ? 'freelancer' : 'general'),
                    title: 'AI Assistant',
                  ))),
          _tile(Icons.info_outline, 'About Vallavan', () => _push(const AboutScreen())),
        ]),
        if (s != null) ...[
          const SizedBox(height: 22),
          OutlinedButton.icon(
            onPressed: _logout,
            icon: const Icon(Icons.logout, size: 16),
            label: const Text('Log out'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.muted,
              side: const BorderSide(color: Colors.white24),
              minimumSize: const Size.fromHeight(46),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
            ),
          ),
        ],
        const SizedBox(height: 28),
      ]),
    );
  }

  Widget _identityCard(PhoneSession? s) {
    final signedIn = s != null;
    final initial = signedIn && s.name.isNotEmpty ? s.name[0].toUpperCase() : 'G';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        CircleAvatar(
          radius: 30,
          backgroundColor: AppColors.red,
          child: Text(initial,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(signedIn ? (s.name.isEmpty ? 'Vallavan Member' : s.name) : 'Guest Viewer',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
            Text(signedIn ? '${s.role} account' : 'Not signed in',
                style: const TextStyle(fontSize: 12, color: AppColors.muted)),
            if (signedIn && s.phone.isNotEmpty)
              Text('+91 ${s.phone}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
          ]),
        ),
        if (!signedIn)
          TextButton(
            onPressed: () => _push(const SponsorLoginScreen()),
            child: const Text('Log in',
                style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 13)),
          ),
      ]),
    );
  }

  Widget _section(String title, List<Widget> children) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(title,
              style: const TextStyle(
                  fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
        ),
        Container(
          decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(14)),
          child: Column(children: children),
        ),
      ]);

  Widget _tile(IconData icon, String label, VoidCallback onTap, {bool accent = false}) => ListTile(
        leading: Icon(icon, color: accent ? AppColors.gold : AppColors.muted, size: 20),
        title: Text(label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.muted, size: 18),
        onTap: onTap,
      );
}
