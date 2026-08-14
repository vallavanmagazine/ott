import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/theme.dart';
import '../../services/pricing_service.dart';
import '../../services/payments_service.dart';
import '../../services/api_service.dart';
import '../../services/sponsor_service.dart';

/// B4 — Wallet top-up with bonus display + payment link. Mirrors web WalletTopUpScreen.
class WalletTopUpScreen extends StatefulWidget {
  const WalletTopUpScreen({super.key});
  @override
  State<WalletTopUpScreen> createState() => _WalletTopUpScreenState();
}

class _WalletTopUpScreenState extends State<WalletTopUpScreen> {
  int _amount = 4999;
  bool _busy = false;
  String? _link;
  String? _error;

  final _tiers = const [(min: 5000, pct: 10), (min: 10000, pct: 20), (min: 25000, pct: 30)];

  Future<String?> _sponsorId() => SponsorService.currentSponsorId();

  Future<void> _generate() async {
    setState(() { _error = null; });
    if (_amount < PricingService.minTopupRupees) {
      setState(() => _error = 'Minimum top-up is ₹${PricingService.minTopupRupees}.');
      return;
    }
    if (!Api.hasBackend) {
      setState(() => _error = 'Payment links need the backend (set API_BASE_URL at build time).');
      return;
    }
    setState(() => _busy = true);
    try {
      final sid = await _sponsorId();
      if (sid == null) { setState(() { _error = 'Complete sponsor signup first.'; _busy = false; }); return; }
      final url = await PaymentsService.createPaymentLink(sponsorId: sid, amountRupees: _amount);
      setState(() { _link = url; _busy = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _busy = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bonus = PricingService.walletBonusRupees(_amount);
    final credited = _amount + bonus;
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Top Up Wallet', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Choose Amount', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: PricingService.topupPresets.map((p) {
          final on = _amount == p;
          return GestureDetector(
            onTap: () => setState(() => _amount = p),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              decoration: BoxDecoration(color: on ? AppColors.red : AppColors.glass, borderRadius: BorderRadius.circular(12)),
              child: Text('₹$p', style: TextStyle(color: on ? Colors.white : AppColors.muted, fontWeight: FontWeight.bold)),
            ),
          );
        }).toList()),
        const SizedBox(height: 12),
        TextField(
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Custom amount (₹)', labelStyle: const TextStyle(color: AppColors.muted),
            filled: true, fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
          onChanged: (v) => setState(() => _amount = int.tryParse(v) ?? 0),
        ),
        const SizedBox(height: 14),
        // Bonus callout
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.gold.withValues(alpha: 0.3))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.card_giftcard, color: AppColors.gold, size: 16),
              const SizedBox(width: 8),
              Text(bonus > 0 ? '+₹$bonus bonus' : 'Add ₹${5000 - _amount} more for a 10% bonus',
                  style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 12)),
            ]),
            const SizedBox(height: 4),
            Text('You\'ll be credited ₹$credited after payment.', style: const TextStyle(color: Colors.white70, fontSize: 11)),
          ]),
        ),
        const SizedBox(height: 12),
        Row(children: _tiers.map((t) {
          final on = _amount >= t.min;
          return Expanded(child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 3),
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(color: on ? AppColors.gold.withValues(alpha: 0.2) : AppColors.glass, borderRadius: BorderRadius.circular(10)),
            child: Column(children: [
              Text('${t.pct}%', style: TextStyle(color: on ? AppColors.gold : Colors.white, fontWeight: FontWeight.w900)),
              Text('₹${t.min ~/ 1000}K+', style: const TextStyle(color: AppColors.muted, fontSize: 9)),
            ]),
          ));
        }).toList()),
        if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : _generate,
          style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
          child: Text(_busy ? 'Generating link…' : 'Generate Payment Link', style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
        const Padding(padding: EdgeInsets.only(top: 8), child: Text('Razorpay payment link (test mode) — no card details entered in-app.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.gold, fontSize: 10))),
        if (_link != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Payment link ready', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(_link!, style: const TextStyle(color: Colors.white, fontSize: 12)),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(child: OutlinedButton.icon(onPressed: () => Clipboard.setData(ClipboardData(text: _link!)), icon: const Icon(Icons.copy, size: 16), label: const Text('Copy'))),
                const SizedBox(width: 8),
                Expanded(child: FilledButton.icon(
                  onPressed: () => launchUrl(Uri.parse('https://wa.me/?text=${Uri.encodeComponent(PaymentsService.shareMessage(_link!, _amount))}'), mode: LaunchMode.externalApplication),
                  style: FilledButton.styleFrom(backgroundColor: AppColors.red),
                  icon: const Icon(Icons.chat, size: 16), label: const Text('Share'))),
              ]),
            ]),
          ),
        ],
      ]),
    );
  }
}
