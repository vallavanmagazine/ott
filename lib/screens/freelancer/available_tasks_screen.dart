import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/freelancer_service.dart';

/// Open tasks a freelancer can pick up.
///
/// Tasks whose required roles overlap the freelancer's own roles are surfaced
/// first — the list is sorted by match rather than filtered, so nothing is
/// hidden from someone willing to stretch.
class AvailableTasksScreen extends StatefulWidget {
  const AvailableTasksScreen({super.key});
  @override
  State<AvailableTasksScreen> createState() => _AvailableTasksScreenState();
}

class _AvailableTasksScreenState extends State<AvailableTasksScreen> {
  List<FreelancerTask> _tasks = [];
  Set<String> _myRoles = {};
  bool _loading = true;
  String? _claiming;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final tasks = await FreelancerService.fetchOpenTasks();
    final profile = await FreelancerService.fetchMyProfile();
    if (!mounted) return;
    final roles = ((profile?['roles'] ?? const []) as List).map((e) => e.toString()).toSet();
    tasks.sort((a, b) {
      final am = a.rolesNeeded.any(roles.contains) ? 0 : 1;
      final bm = b.rolesNeeded.any(roles.contains) ? 0 : 1;
      return am.compareTo(bm);
    });
    setState(() { _tasks = tasks; _myRoles = roles; _loading = false; });
  }

  Future<void> _claim(FreelancerTask t) async {
    setState(() => _claiming = t.id);
    final err = await FreelancerService.claimTask(t);
    if (!mounted) return;
    setState(() => _claiming = null);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(err ?? 'Task added to your assignments.')),
    );
    if (err == null) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Available Tasks', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : _tasks.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(28),
                    child: Text('No open tasks right now.\nCheck back soon.',
                        textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.red,
                  backgroundColor: AppColors.dark,
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _tasks.length,
                    itemBuilder: (_, i) => _card(_tasks[i]),
                  ),
                ),
    );
  }

  Widget _card(FreelancerTask t) {
    final matched = t.rolesNeeded.any(_myRoles.contains);
    final busy = _claiming == t.id;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.glass,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: matched ? AppColors.gold.withValues(alpha: 0.4) : Colors.white10),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Text(t.title,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15)),
          ),
          if (matched)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
              child: const Text('MATCHES YOU',
                  style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: AppColors.gold)),
            ),
        ]),
        if (t.description != null && t.description!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Text(t.description!,
                style: const TextStyle(color: AppColors.muted, fontSize: 12, height: 1.4)),
          ),
        if (t.location != null && t.location!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(children: [
              const Icon(Icons.place_outlined, size: 13, color: AppColors.muted),
              const SizedBox(width: 5),
              Text(t.location!, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
            ]),
          ),
        if (t.rolesNeeded.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: t.rolesNeeded.map((r) {
                final mine = _myRoles.contains(r);
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: (mine ? AppColors.gold : Colors.white).withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(r,
                      style: TextStyle(
                          fontSize: 10,
                          color: mine ? AppColors.gold : Colors.white70,
                          fontWeight: FontWeight.bold)),
                );
              }).toList(),
            ),
          ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: busy ? null : () => _claim(t),
            icon: const Icon(Icons.add_task, size: 16),
            label: Text(busy ? 'Picking up...' : 'Pick Up Task'),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.red,
              padding: const EdgeInsets.symmetric(vertical: 11),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
            ),
          ),
        ),
      ]),
    );
  }
}
