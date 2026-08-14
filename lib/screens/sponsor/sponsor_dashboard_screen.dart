import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/campaign.dart';
import '../../services/auth_service.dart';
import '../../services/supabase_client.dart';
import 'create_campaign_screen.dart';
import 'wallet_topup_screen.dart';
import '../ai_chatbot_screen.dart';

class SponsorDashboardScreen extends StatefulWidget {
  const SponsorDashboardScreen({super.key});
  @override
  State<SponsorDashboardScreen> createState() => _SponsorDashboardScreenState();
}

class _SponsorDashboardScreenState extends State<SponsorDashboardScreen> {
  List<Campaign> _campaigns = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final c = Db.client;
    if (c == null) { setState(() => _loading = false); return; }
    try {
      final user = c.auth.currentUser;
      String? sponsorId;
      if (user != null) {
        final s = await c.from('sponsors').select('id').eq('owner_id', user.id).maybeSingle();
        sponsorId = s?['id']?.toString();
      }
      final query = sponsorId != null
          ? await c.from('campaigns').select().eq('sponsor_id', sponsorId).order('created_at', ascending: false)
          : <dynamic>[];
      if (mounted) setState(() { _campaigns = query.map((r) => Campaign.fromMap(r as Map<String, dynamic>)).toList(); _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final active = _campaigns.where((c) => c.status == 'Active').length;
    final spend = _campaigns.fold<int>(0, (s, c) => s + c.spendRupees);
    final impressions = _campaigns.fold<int>(0, (s, c) => s + c.impressions);
    final clicks = _campaigns.fold<int>(0, (s, c) => s + c.clicks);

    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Sponsor Dashboard', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black,
        actions: [
          IconButton(
            tooltip: 'AI Ad Assistant',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AIChatbotScreen(variant: 'sponsor', title: 'AI Ad Assistant'))),
            icon: const Icon(Icons.smart_toy_outlined, size: 20),
          ),
          IconButton(onPressed: () async { await AuthService.logout(); if (context.mounted) Navigator.pop(context); }, icon: const Icon(Icons.logout, size: 20)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : ListView(padding: const EdgeInsets.all(16), children: [
              GridView.count(
                crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), childAspectRatio: 1.9, crossAxisSpacing: 12, mainAxisSpacing: 12,
                children: [
                  _stat('Active Campaigns', '$active', AppColors.red),
                  _stat('Total Spend', '₹${spend.toString()}', AppColors.gold),
                  _stat('Impressions', '$impressions', const Color(0xFF1565C0)),
                  _stat('Clicks', '$clicks', const Color(0xFF00838F)),
                ],
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletTopUpScreen())),
                icon: const Icon(Icons.account_balance_wallet), label: const Text('Top Up Wallet'),
                style: FilledButton.styleFrom(backgroundColor: AppColors.gold, foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
              ),
              const SizedBox(height: 10),
              FilledButton.icon(
                onPressed: () async { await Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateCampaignScreen())); _load(); },
                icon: const Icon(Icons.add), label: const Text('Create Campaign'),
                style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
              ),
              const SizedBox(height: 20),
              const Text('MY CAMPAIGNS', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (_campaigns.isEmpty) const Padding(padding: EdgeInsets.all(20), child: Center(child: Text('No campaigns yet', style: TextStyle(color: AppColors.muted))))
              else ..._campaigns.map((c) => Container(
                    margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Expanded(child: Text(c.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                      Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)), child: Text(c.status, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.gold))),
                    ]),
                  )),
              const SizedBox(height: 24),
            ]),
    );
  }

  Widget _stat(String label, String value, Color color) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(14)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.muted)),
        ]),
      );
}
