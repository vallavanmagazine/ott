import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/auth_service.dart';
import '../../services/pricing_service.dart';
import 'sponsor_dashboard_screen.dart';
import 'sponsor_login_screen.dart';

/// B1 — Sponsor promo / pricing page. Mirrors web SponsorPromoScreen.
class SponsorPromoScreen extends StatefulWidget {
  const SponsorPromoScreen({super.key});
  @override
  State<SponsorPromoScreen> createState() => _SponsorPromoScreenState();
}

class _SponsorPromoScreenState extends State<SponsorPromoScreen> {
  List<PricingRate> _rates = [];
  List<InspirePackage> _packages = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final rates = await PricingService.fetchPricingRates();
    final packages = await PricingService.fetchInspirePackages();
    if (mounted) setState(() { _rates = rates; _packages = packages; _loading = false; });
  }

  void _start() {
    final next = AuthService.isLoggedIn ? const SponsorDashboardScreen() : const SponsorLoginScreen();
    Navigator.push(context, MaterialPageRoute(builder: (_) => next));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Become a Sponsor', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : ListView(padding: const EdgeInsets.all(16), children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), gradient: LinearGradient(colors: [AppColors.gold.withValues(alpha: 0.18), AppColors.black])),
                child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Reach millions of Tamil viewers', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white)),
                  SizedBox(height: 8),
                  Text('District-targeted ads on a free, sponsor-funded platform. Pay per published post — no wasted spend.', style: TextStyle(fontSize: 13, color: AppColors.muted)),
                ]),
              ),
              const SizedBox(height: 20),
              Row(children: [
                _why(Icons.place, 'Geo-targeted', '38 TN districts'),
                const SizedBox(width: 10),
                _why(Icons.bolt, 'Pay per post', 'No idle spend'),
                const SizedBox(width: 10),
                _why(Icons.trending_up, 'Wallet bonus', 'Up to 30%'),
              ]),
              const SizedBox(height: 24),
              const Text('DISPLAY AD PRICING', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ..._rates.map((r) => Container(
                    margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text('${r.districtCount} district${r.districtCount == 1 ? '' : 's'}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                      Text('₹${r.rupees} / day', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900)),
                    ]),
                  )),
              const SizedBox(height: 20),
              const Text('INSPIRE PR VIDEO', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ..._packages.map((p) => Container(
                    margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.gold.withValues(alpha: 0.25))),
                    child: Row(children: [
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(p.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15)),
                        if (p.description != null) Text(p.description!, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                      ])),
                      Text('₹${p.rupees}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 16)),
                    ]),
                  )),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _start,
                style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
                child: const Text('Start Now', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
              ),
              const SizedBox(height: 24),
            ]),
    );
  }

  Widget _why(IconData icon, String title, String sub) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, color: AppColors.gold, size: 20),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
            Text(sub, style: const TextStyle(color: AppColors.muted, fontSize: 10)),
          ]),
        ),
      );
}
