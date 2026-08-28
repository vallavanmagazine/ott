import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/auth_phone_service.dart';
import '../../services/freelancer_service.dart';
import '../ai_chatbot_screen.dart';
import 'ad_sales_screen.dart';
import 'available_tasks_screen.dart';
import 'freelancer_earnings_screen.dart';
import 'freelancer_profile_screen.dart';
import 'freelancer_submit_screen.dart';
import 'magazine_reseller_screen.dart';
import 'my_assignments_screen.dart';

/// Freelancer dashboard: earnings summary plus the eight feature tiles.
class FreelancerDashboardScreen extends StatefulWidget {
  const FreelancerDashboardScreen({super.key});
  @override
  State<FreelancerDashboardScreen> createState() => _FreelancerDashboardScreenState();
}

class _FreelancerDashboardScreenState extends State<FreelancerDashboardScreen> {
  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _assignments = const [];
  int _paid = 0;
  int _pending = 0;
  int _openTasks = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final profile = await FreelancerService.fetchMyProfile();
    final tasks = await FreelancerService.fetchOpenTasks();
    final assignments = await FreelancerService.fetchMyAssignments();
    final earnings = await FreelancerService.fetchEarnings();
    if (!mounted) return;
    setState(() {
      _profile = profile;
      _openTasks = tasks.length;
      _assignments = assignments;
      _paid = earnings.paid;
      _pending = earnings.pending;
      _loading = false;
    });
  }

  Future<void> _push(Widget screen) async {
    await Navigator.push(context, MaterialPageRoute<void>(builder: (_) => screen));
    if (mounted) _load();
  }

  Future<void> _logout() async {
    await AuthPhone.logout();
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final status = (_profile?['status'] ?? 'not registered').toString();
    final name = (_profile?['name'] ?? 'Freelancer').toString();
    final active = _assignments.where((a) => a['status'] == 'assigned').length;

    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Freelancer Dashboard', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
        actions: [
          IconButton(onPressed: _logout, icon: const Icon(Icons.logout, size: 20), tooltip: 'Log out'),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : RefreshIndicator(
              color: AppColors.red,
              backgroundColor: AppColors.dark,
              onRefresh: _load,
              child: ListView(padding: const EdgeInsets.all(16), children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.red.withValues(alpha: 0.25), AppColors.dark],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.badge, color: AppColors.gold, size: 30),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                        const SizedBox(height: 2),
                        Text('Status: $status',
                            style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                      ]),
                    ),
                  ]),
                ),
                const SizedBox(height: 14),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.9,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  children: [
                    _stat('Open Tasks', '$_openTasks', const Color(0xFF1565C0)),
                    _stat('Active Work', '$active', AppColors.red),
                    _stat('Earned', 'Rs.$_paid', Colors.green),
                    _stat('Pending', 'Rs.$_pending', AppColors.gold),
                  ],
                ),
                const SizedBox(height: 20),
                const _Label('MY WORK'),
                const SizedBox(height: 10),
                GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 0.92,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  children: [
                    _Tile(Icons.assignment_outlined, 'Available\nTasks',
                        () => _push(const AvailableTasksScreen())),
                    _Tile(Icons.work_outline, 'My\nAssignments',
                        () => _push(const MyAssignmentsScreen())),
                    _Tile(Icons.upload_file, 'Submit\nContent',
                        () => _push(const FreelancerSubmitScreen())),
                    _Tile(Icons.account_balance_wallet_outlined, 'Earnings &\nPayments',
                        () => _push(const FreelancerEarningsScreen())),
                    _Tile(Icons.menu_book_outlined, 'Magazine\nReseller',
                        () => _push(const MagazineResellerScreen())),
                    _Tile(Icons.campaign_outlined, 'Ad Sales', () => _push(const AdSalesScreen())),
                    _Tile(Icons.person_outline, 'Profile &\nDocuments',
                        () => _push(const FreelancerProfileScreen())),
                    _Tile(Icons.smart_toy_outlined, 'AI\nAssistant',
                        () => _push(const AIChatbotScreen(
                            variant: 'freelancer', title: 'AI Assistant'))),
                  ],
                ),
                const SizedBox(height: 22),
                const _Label('ACTIVE ASSIGNMENTS'),
                const SizedBox(height: 8),
                if (_assignments.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(20),
                    child: Center(
                      child: Text('No assignments yet — pick up a task to begin.',
                          style: TextStyle(color: AppColors.muted)),
                    ),
                  )
                else
                  ..._assignments.take(5).map(_assignmentRow),
                const SizedBox(height: 24),
              ]),
            ),
    );
  }

  Widget _assignmentRow(Map<String, dynamic> a) {
    final status = (a['status'] ?? 'assigned').toString();
    final title = (a['freelancer_tasks']?['title'] ?? 'Task').toString();
    final pay = ((a['payment_amount_paise'] ?? 0) as num).toInt() ~/ 100;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            Text('Rs.$pay', style: const TextStyle(color: AppColors.muted, fontSize: 11)),
          ]),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
          child: Text(status,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.gold)),
        ),
      ]),
    );
  }

  Widget _stat(String label, String value, Color color) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(14)),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FittedBox(
                child: Text(value,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
              ),
              Text(label, style: const TextStyle(fontSize: 10, color: AppColors.muted)),
            ]),
      );
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold));
}

class _Tile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  const _Tile(this.icon, this.label, this.onTap);

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.glass,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white10),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, color: AppColors.gold, size: 22),
            const SizedBox(height: 6),
            Text(label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w600, height: 1.2)),
          ]),
        ),
      );
}
