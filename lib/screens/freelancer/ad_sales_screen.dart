import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/freelancer_service.dart';

/// C6 — Ad sales at 20% commission. Mirrors web AdSalesScreen.
class AdSalesScreen extends StatefulWidget {
  const AdSalesScreen({super.key});
  @override
  State<AdSalesScreen> createState() => _AdSalesScreenState();
}

class _AdSalesScreenState extends State<AdSalesScreen> {
  final _business = TextEditingController();
  int _sale = 5000;
  bool _busy = false;
  String? _error;
  List<Map<String, dynamic>> _sales = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _business.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final s = await FreelancerService.fetchAdSales();
    if (mounted) setState(() => _sales = s);
  }

  Future<void> _submit() async {
    setState(() { _error = null; });
    if (_business.text.trim().isEmpty) { setState(() => _error = 'Enter the business name.'); return; }
    setState(() => _busy = true);
    final err = await FreelancerService.logAdSale(_business.text.trim(), _sale);
    if (!mounted) return;
    setState(() { _busy = false; _error = err; });
    if (err == null) { _business.clear(); _load(); }
  }

  @override
  Widget build(BuildContext context) {
    final commission = (_sale * FreelancerService.adSalesCommission).round();
    final earned = _sales.fold<int>(0, (s, r) => s + (((r['commission_paise'] ?? 0) as num).toInt() ~/ 100));
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Ad Sales', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('COMMISSION RATE', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
              Text('${(FreelancerService.adSalesCommission * 100).round()}%', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.gold)),
            ]),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              const Text('EARNED', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
              Text('₹$earned', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF2E7D32))),
            ]),
          ]),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _business,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(labelText: 'Business Name', labelStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
        ),
        const SizedBox(height: 12),
        TextField(
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white),
          controller: TextEditingController(text: '$_sale')..selection = TextSelection.collapsed(offset: '$_sale'.length),
          decoration: InputDecoration(labelText: 'Sale Amount (₹)', labelStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
          onChanged: (v) => setState(() => _sale = int.tryParse(v) ?? 0),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.gold.withValues(alpha: 0.3))),
          child: Row(children: [
            const Icon(Icons.currency_rupee, color: AppColors.gold, size: 16),
            const SizedBox(width: 6),
            Text('Your commission: ₹$commission', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
          ]),
        ),
        if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : _submit,
          style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
          child: Text(_busy ? 'Logging…' : 'Log Ad Sale', style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
        if (_sales.isNotEmpty) ...[
          const SizedBox(height: 20),
          const Text('MY AD SALES', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._sales.map((s) {
            final sale = ((s['sale_amount_paise'] ?? 0) as num).toInt() ~/ 100;
            final comm = ((s['commission_paise'] ?? 0) as num).toInt() ~/ 100;
            return Container(
              margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
              child: Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text((s['business_name'] ?? '').toString(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  Text('sale ₹$sale', style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                ])),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('₹$comm', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900)),
                  Text((s['status'] ?? '').toString(), style: const TextStyle(color: AppColors.muted, fontSize: 9, fontWeight: FontWeight.bold)),
                ]),
              ]),
            );
          }),
        ],
      ]),
    );
  }
}
