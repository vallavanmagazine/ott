import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/freelancer_service.dart';
import 'freelancer_submit_screen.dart';
import 'freelancer_earnings_screen.dart';
import 'magazine_reseller_screen.dart';
import 'ad_sales_screen.dart';

/// C3 — Freelancer dashboard. Mirrors web FreelancerDashboardScreen.
class FreelancerDashboardScreen extends StatefulWidget {
  const FreelancerDashboardScreen({super.key});
  @override
  State<FreelancerDashboardScreen> createState() => _FreelancerDashboardScreenState();
}

class _FreelancerDashboardScreenState extends State<FreelancerDashboardScreen> {
  Map<String, dynamic>? _profile;
  List<FreelancerTask> _tasks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final profile = await FreelancerService.fetchMyProfile();
    final tasks = await FreelancerService.fetchOpenTasks();
    if (mounted) setState(() { _profile = profile; _tasks = tasks; _loading = false; });
  }

  void _push(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen)).then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    final status = (_profile?['status'] ?? 'not_applied').toString();
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Freelancer Dashboard', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : ListView(padding: const EdgeInsets.all(16), children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
                child: Row(children: [
                  const Icon(Icons.badge, color: AppColors.gold, size: 28),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text((_profile?['name'] ?? 'Freelancer').toString(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15)),
                    Text('Status: $status', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                  ])),
                ]),
              ),
              const SizedBox(height: 16),
              GridView.count(
                crossAxisCount: 3, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 0.95, crossAxisSpacing: 10, mainAxisSpacing: 10,
                children: [
                  _Tile(Icons.upload_file, 'Submissions', () => _push(const FreelancerSubmitScreen())),
                  _Tile(Icons.account_balance_wallet, 'Earnings', () => _push(const FreelancerEarningsScreen())),
                  _Tile(Icons.menu_book, 'Magazine', () => _push(const MagazineResellerScreen())),
                  _Tile(Icons.campaign, 'Ad Sales', () => _push(const AdSalesScreen())),
                  const _Tile(Icons.assignment, 'Tasks', null),
                  const _Tile(Icons.school, 'Training', null),
                ],
              ),
              const SizedBox(height: 20),
              const Text('AVAILABLE TASKS', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (_tasks.isEmpty)
                const Padding(padding: EdgeInsets.all(20), child: Center(child: Text('No open tasks right now', style: TextStyle(color: AppColors.muted))))
              else
                ..._tasks.map((t) => Container(
                      margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(t.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        if (t.description != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(t.description!, style: const TextStyle(color: AppColors.muted, fontSize: 12))),
                        if (t.rolesNeeded.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Wrap(spacing: 6, children: t.rolesNeeded.map((r) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
                          child: Text(r, style: const TextStyle(fontSize: 10, color: AppColors.gold, fontWeight: FontWeight.bold)),
                        )).toList())),
                      ]),
                    )),
              const SizedBox(height: 24),
            ]),
    );
  }
}

class _Tile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  const _Tile(this.icon, this.label, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, color: AppColors.gold, size: 22),
            const SizedBox(height: 6),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
          ]),
        ),
      );
}
