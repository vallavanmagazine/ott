import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/freelancer_service.dart';

/// C5 — Magazine reseller (₹14 → ₹20). Mirrors web MagazineResellerScreen.
class MagazineResellerScreen extends StatefulWidget {
  const MagazineResellerScreen({super.key});
  @override
  State<MagazineResellerScreen> createState() => _MagazineResellerScreenState();
}

class _MagazineResellerScreenState extends State<MagazineResellerScreen> {
  int _qty = 25;
  bool _busy = false;
  String? _error;
  List<Map<String, dynamic>> _orders = [];

  static const _presets = [10, 25, 50, 100];
  int get _cost => _qty * FreelancerService.magazineCostRupees;
  int get _profit => _qty * (FreelancerService.magazineSellRupees - FreelancerService.magazineCostRupees);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final o = await FreelancerService.fetchMagazineOrders();
    if (mounted) setState(() => _orders = o);
  }

  Future<void> _place() async {
    setState(() { _busy = true; _error = null; });
    final err = await FreelancerService.createMagazineOrder(_qty);
    if (!mounted) return;
    setState(() { _busy = false; _error = err; });
    if (err == null) _load();
  }

  @override
  Widget build(BuildContext context) {
    const margin = FreelancerService.magazineSellRupees - FreelancerService.magazineCostRupees;
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Magazine Reseller', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
          child: const Row(children: [
            Icon(Icons.menu_book, color: AppColors.gold, size: 18),
            SizedBox(width: 8),
            Expanded(child: Text('Buy at ₹${FreelancerService.magazineCostRupees}, sell at ₹${FreelancerService.magazineSellRupees} — keep ₹$margin per copy.',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13))),
          ]),
        ),
        const SizedBox(height: 16),
        const Text('QUANTITY', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Row(children: _presets.map((q) {
          final on = _qty == q;
          return Expanded(child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: GestureDetector(
              onTap: () => setState(() => _qty = q),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(color: on ? AppColors.red : AppColors.glass, borderRadius: BorderRadius.circular(12)),
                child: Center(child: Text('$q', style: TextStyle(color: on ? Colors.white : AppColors.muted, fontWeight: FontWeight.bold))),
              ),
            ),
          ));
        }).toList()),
        const SizedBox(height: 12),
        TextField(
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white),
          controller: TextEditingController(text: '$_qty')..selection = TextSelection.collapsed(offset: '$_qty'.length),
          decoration: InputDecoration(filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
          onChanged: (v) => _qty = int.tryParse(v) ?? _qty,
        ),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: _box('Your Cost', '₹$_cost', Colors.white, AppColors.glass)),
          const SizedBox(width: 12),
          Expanded(child: _box('Profit', '₹$_profit', AppColors.gold, AppColors.gold.withValues(alpha: 0.10))),
        ]),
        if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : _place,
          style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
          child: Text(_busy ? 'Placing order…' : 'Order $_qty Copies (₹$_cost)', style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
        if (_orders.isNotEmpty) ...[
          const SizedBox(height: 20),
          const Text('ORDER HISTORY', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._orders.map((o) {
            final qty = (o['quantity'] ?? 0) as int;
            final total = ((o['total_paise'] ?? 0) as num).toInt() ~/ 100;
            return Container(
              margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
              child: Row(children: [
                Expanded(child: Text('$qty copies · ₹$total', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                Text((o['status'] ?? '').toString(), style: const TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold)),
              ]),
            );
          }),
        ],
      ]),
    );
  }

  Widget _box(String label, String value, Color color, Color bg) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withValues(alpha: 0.25))),
        child: Column(children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 9, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
        ]),
      );
}
