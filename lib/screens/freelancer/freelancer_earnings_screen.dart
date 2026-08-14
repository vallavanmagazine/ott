import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/freelancer_service.dart';

/// C4 — Freelancer earnings. Mirrors web FreelancerEarningsScreen.
class FreelancerEarningsScreen extends StatefulWidget {
  const FreelancerEarningsScreen({super.key});
  @override
  State<FreelancerEarningsScreen> createState() => _FreelancerEarningsScreenState();
}

class _FreelancerEarningsScreenState extends State<FreelancerEarningsScreen> {
  List<Map<String, dynamic>> _rows = [];
  int _paid = 0, _pending = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    FreelancerService.fetchEarnings().then((e) {
      if (mounted) setState(() { _rows = e.rows; _paid = e.paid; _pending = e.pending; _loading = false; });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('My Earnings', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : ListView(padding: const EdgeInsets.all(16), children: [
              Row(children: [
                _stat('Paid', _paid, const Color(0xFF2E7D32)),
                const SizedBox(width: 12),
                _stat('Pending', _pending, AppColors.gold),
              ]),
              const SizedBox(height: 20),
              const Text('EARNINGS HISTORY', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (_rows.isEmpty)
                const Padding(padding: EdgeInsets.all(20), child: Center(child: Text('No earnings yet. Complete tasks, resell magazines, or sell ads to earn.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted))))
              else
                ..._rows.map((r) {
                  final amt = ((r['amount_paise'] ?? 0) as num).toInt() ~/ 100;
                  final paid = r['status'] == 'paid';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
                    child: Row(children: [
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text((r['type'] ?? '').toString().replaceAll('_', ' '), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        if (r['description'] != null) Text(r['description'].toString(), style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                      ])),
                      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text('₹$amt', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
                        Text(paid ? 'paid' : 'pending', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: paid ? const Color(0xFF66BB6A) : AppColors.gold)),
                      ]),
                    ]),
                  );
                }),
            ]),
    );
  }

  Widget _stat(String label, int value, Color color) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('₹$value', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
          ]),
        ),
      );
}
