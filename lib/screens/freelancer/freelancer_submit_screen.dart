import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/freelancer_service.dart';
import '../../utils/video.dart';

/// C3 — Content submission for assignments. Mirrors web FreelancerSubmitScreen.
class FreelancerSubmitScreen extends StatefulWidget {
  const FreelancerSubmitScreen({super.key});
  @override
  State<FreelancerSubmitScreen> createState() => _FreelancerSubmitScreenState();
}

class _FreelancerSubmitScreenState extends State<FreelancerSubmitScreen> {
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

  Future<void> _openSubmit(Map<String, dynamic> a) async {
    final urlCtrl = TextEditingController();
    final thumbCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    String? error;
    bool busy = false;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.black,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSheet) {
        return Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Submit: ${a['freelancer_tasks']?['title'] ?? 'Task'}', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
            const SizedBox(height: 16),
            TextField(controller: urlCtrl, onChanged: (_) => setSheet(() {}), style: const TextStyle(color: Colors.white), decoration: InputDecoration(hintText: 'Content URL (https://…)', hintStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none))),
            _VideoUrlHint(url: urlCtrl.text),
            const SizedBox(height: 10),
            TextField(controller: thumbCtrl, style: const TextStyle(color: Colors.white), decoration: InputDecoration(hintText: 'Thumbnail URL (https://...)', hintStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none))),
            const SizedBox(height: 10),
            TextField(controller: notesCtrl, maxLines: 2, style: const TextStyle(color: Colors.white), decoration: InputDecoration(hintText: 'Notes (optional)', hintStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none))),
            if (error != null) Padding(padding: const EdgeInsets.only(top: 10), child: Text(error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
            const SizedBox(height: 14),
            SizedBox(width: double.infinity, child: FilledButton(
              onPressed: busy ? null : () async {
                if (urlCtrl.text.trim().isEmpty) { setSheet(() => error = 'Provide a content URL.'); return; }
                setSheet(() => busy = true);
                final err = await FreelancerService.submitContent(a['id'].toString(), urlCtrl.text.trim(), thumbnailUrl: thumbCtrl.text.trim(), notes: notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim());
                if (err != null) { setSheet(() { busy = false; error = err; }); return; }
                if (ctx.mounted) Navigator.pop(ctx);
              },
              style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
              child: Text(busy ? 'Submitting…' : 'Submit for Review', style: const TextStyle(fontWeight: FontWeight.w900)),
            )),
          ]),
        );
      }),
    );
    _load();
  }

  Color _badge(String s) => s == 'approved' ? const Color(0xFF2E7D32) : s == 'submitted' ? const Color(0xFF1565C0) : s == 'paid' ? AppColors.gold : AppColors.muted;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Submit Content', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : _assignments.isEmpty
              ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('No assignments yet. Accept a task from your dashboard to begin.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted))))
              : ListView(padding: const EdgeInsets.all(16), children: _assignments.map((a) {
                  final status = (a['status'] ?? 'assigned').toString();
                  final pay = ((a['payment_amount_paise'] ?? 0) as num).toInt() ~/ 100;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Expanded(child: Text((a['freelancer_tasks']?['title'] ?? 'Task').toString(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                        Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: _badge(status).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)), child: Text(status, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: _badge(status)))),
                      ]),
                      Padding(padding: const EdgeInsets.only(top: 4), child: Text('${a['role'] ?? ''} · ₹$pay', style: const TextStyle(color: AppColors.muted, fontSize: 11))),
                      if (a['content_url'] != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(a['content_url'].toString(), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF64B5F6), fontSize: 11))),
                      if (status == 'assigned' || status == 'rejected') Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: FilledButton.icon(
                          onPressed: () => _openSubmit(a),
                          style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8)),
                          icon: const Icon(Icons.upload, size: 15), label: const Text('Submit Content'),
                        ),
                      ),
                    ]),
                  );
                }).toList()),
    );
  }
}

/// Shows what a pasted URL was detected as and, for YouTube watch/shorts/
/// youtu.be links, the embed URL that will actually be stored.
///
/// Mirrors the web CMS's `VideoUrlHint`: the submission is rewritten on save
/// (see FreelancerService.submitContent), so making the rewrite visible stops
/// the freelancer wondering why the stored link differs from what they pasted.
class _VideoUrlHint extends StatelessWidget {
  final String url;
  const _VideoUrlHint({required this.url});

  @override
  Widget build(BuildContext context) {
    if (url.trim().isEmpty) return const SizedBox.shrink();
    final converted = toEmbedUrl(url);
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Detected: ${videoKindLabel(url)}', style: const TextStyle(fontSize: 10, color: AppColors.gold)),
        if (willConvert(url) && converted != null)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text('Saved as $converted', style: const TextStyle(fontSize: 10, color: AppColors.muted)),
          ),
      ]),
    );
  }
}
