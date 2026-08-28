import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/freelancer_service.dart';
import '../../utils/formatters.dart';
import 'freelancer_submit_screen.dart';

/// Active work with deadlines. Submission itself lives in
/// [FreelancerSubmitScreen]; this screen is the status overview.
class MyAssignmentsScreen extends StatefulWidget {
  const MyAssignmentsScreen({super.key});
  @override
  State<MyAssignmentsScreen> createState() => _MyAssignmentsScreenState();
}

class _MyAssignmentsScreenState extends State<MyAssignmentsScreen> {
  List<Map<String, dynamic>> _assignments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final a = await FreelancerService.fetchMyAssignments();
    if (mounted) setState(() { _assignments = a; _loading = false; });
  }

  static Color _statusColor(String s) => switch (s) {
        'approved' => const Color(0xFF2E7D32),
        'submitted' => const Color(0xFF1565C0),
        'paid' => AppColors.gold,
        'rejected' => AppColors.red,
        _ => AppColors.muted,
      };

  /// Days remaining until the deadline; negative when overdue.
  static int? _daysLeft(dynamic due) {
    if (due == null) return null;
    final d = DateTime.tryParse(due.toString());
    if (d == null) return null;
    return d.difference(DateTime.now()).inDays;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('My Assignments', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : _assignments.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(28),
                    child: Text('No assignments yet.\nPick up a task to get started.',
                        textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.red,
                  backgroundColor: AppColors.dark,
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _assignments.length,
                    itemBuilder: (_, i) => _card(_assignments[i]),
                  ),
                ),
    );
  }

  Widget _card(Map<String, dynamic> a) {
    final status = (a['status'] ?? 'assigned').toString();
    final pay = ((a['payment_amount_paise'] ?? 0) as num).toInt() ~/ 100;
    final title = (a['freelancer_tasks']?['title'] ?? 'Task').toString();
    final days = _daysLeft(a['due_date']);
    final color = _statusColor(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.glass,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Text(title,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15)),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration:
                BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
            child: Text(status.toUpperCase(),
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
          ),
        ]),
        const SizedBox(height: 6),
        Row(children: [
          if ((a['role'] ?? '').toString().isNotEmpty) ...[
            Text(a['role'].toString(), style: const TextStyle(color: AppColors.gold, fontSize: 11)),
            const Text('  ·  ', style: TextStyle(color: AppColors.muted, fontSize: 11)),
          ],
          Text('Rs.$pay', style: const TextStyle(color: Colors.white70, fontSize: 11)),
        ]),
        if (days != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Row(children: [
              Icon(days < 0 ? Icons.warning_amber_rounded : Icons.schedule,
                  size: 13, color: days < 0 ? AppColors.red : AppColors.muted),
              const SizedBox(width: 5),
              Text(
                days < 0
                    ? 'Overdue by ${-days} day${days == -1 ? '' : 's'}'
                    : (days == 0 ? 'Due today' : 'Due in $days day${days == 1 ? '' : 's'}'),
                style: TextStyle(
                    color: days < 0 ? AppColors.red : AppColors.muted,
                    fontSize: 11,
                    fontWeight: days < 0 ? FontWeight.bold : FontWeight.normal),
              ),
              const Spacer(),
              Text(formatDate(a['due_date']?.toString()),
                  style: const TextStyle(color: AppColors.muted, fontSize: 10)),
            ]),
          ),
        if (a['content_url'] != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(a['content_url'].toString(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Color(0xFF64B5F6), fontSize: 11)),
          ),
        if (status == 'assigned' || status == 'rejected')
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () async {
                  await Navigator.push(context,
                      MaterialPageRoute<void>(builder: (_) => const FreelancerSubmitScreen()));
                  if (mounted) _load();
                },
                icon: const Icon(Icons.upload, size: 16),
                label: const Text('Submit Content'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.red,
                  padding: const EdgeInsets.symmetric(vertical: 11),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
              ),
            ),
          ),
      ]),
    );
  }
}
