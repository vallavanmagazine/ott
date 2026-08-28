import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/campaign.dart';
import '../../services/auth_phone_service.dart';
import '../../services/auth_service.dart';
import '../../services/sponsor_service.dart';
import '../../services/wallet_service.dart';
import '../ai_chatbot_screen.dart';
import 'ai_studio_screen.dart';
import 'billing_screen.dart';
import 'campaign_analytics_screen.dart';
import 'create_campaign_screen.dart';
import 'creative_library_screen.dart';
import 'geo_targeting_screen.dart';
import 'my_campaigns_screen.dart';

/// Sponsor dashboard: an at-a-glance overview plus the nine feature tiles.
class SponsorDashboardScreen extends StatefulWidget {
  const SponsorDashboardScreen({super.key});
  @override
  State<SponsorDashboardScreen> createState() => _SponsorDashboardScreenState();
}

class _SponsorDashboardScreenState extends State<SponsorDashboardScreen> {
  List<Campaign> _campaigns = [];
  WalletView _wallet = WalletView.empty;
  Map<String, dynamic>? _profile;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final campaigns = await SponsorService.fetchCampaigns();
    final wallet = await WalletService.fetch();
    final profile = await SponsorService.fetchProfile();
    if (!mounted) return;
    setState(() {
      _campaigns = campaigns;
      _wallet = wallet;
      _profile = profile;
      _loading = false;
    });
  }

  /// Pushes a screen and refreshes the overview when it pops, so wallet and
  /// campaign counts stay accurate after a top-up or a new campaign.
  Future<void> _push(Widget screen) async {
    await Navigator.push(context, MaterialPageRoute<void>(builder: (_) => screen));
    if (mounted) _load();
  }

  Future<void> _logout() async {
    await AuthPhone.logout();
    await AuthService.logout();
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final active = _campaigns.where((c) => c.status == 'Active').length;
    final impressions = _campaigns.fold<int>(0, (s, c) => s + c.impressions);
    final clicks = _campaigns.fold<int>(0, (s, c) => s + c.clicks);
    final ctr = impressions == 0 ? 0.0 : (clicks / impressions) * 100;
    final sponsorName = (_profile?['name'] ?? 'Sponsor').toString();

    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Sponsor Dashboard', style: TextStyle(fontWeight: FontWeight.w900)),
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
                _walletCard(sponsorName),
                const SizedBox(height: 14),
                const _Label('OVERVIEW'),
                const SizedBox(height: 8),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.9,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  children: [
                    _stat('Active Campaigns', '$active', AppColors.red),
                    _stat('Impressions', _compact(impressions), const Color(0xFF1565C0)),
                    _stat('Clicks', _compact(clicks), const Color(0xFF00838F)),
                    _stat('CTR', '${ctr.toStringAsFixed(2)}%', AppColors.gold),
                  ],
                ),
                const SizedBox(height: 20),
                const _Label('MANAGE'),
                const SizedBox(height: 10),
                GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 0.92,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  children: [
                    _Tile(Icons.add_circle_outline, 'Create\nCampaign',
                        () => _push(const CreateCampaignScreen())),
                    _Tile(Icons.campaign_outlined, 'My\nCampaigns',
                        () => _push(const MyCampaignsScreen())),
                    _Tile(Icons.auto_awesome, 'AI Studio', () => _push(const AiStudioScreen())),
                    _Tile(Icons.photo_library_outlined, 'Creative\nLibrary',
                        () => _push(const CreativeLibraryScreen())),
                    _Tile(Icons.map_outlined, 'Geo\nTargeting', () => _push(const GeoTargetingScreen())),
                    _Tile(Icons.insights_outlined, 'Campaign\nAnalytics',
                        () => _push(const CampaignAnalyticsScreen())),
                    _Tile(Icons.account_balance_wallet_outlined, 'Billing &\nWallet',
                        () => _push(const BillingScreen())),
                    _Tile(Icons.smart_toy_outlined, 'AI\nAssistant',
                        () => _push(const AIChatbotScreen(variant: 'sponsor', title: 'AI Ad Assistant'))),
                  ],
                ),
                const SizedBox(height: 22),
                const _Label('RECENT CAMPAIGNS'),
                const SizedBox(height: 8),
                if (_campaigns.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(20),
                    child: Center(child: Text('No campaigns yet', style: TextStyle(color: AppColors.muted))),
                  )
                else
                  ..._campaigns.take(5).map(_campaignRow),
                const SizedBox(height: 24),
              ]),
            ),
    );
  }

  Widget _walletCard(String sponsorName) => Container(
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
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(sponsorName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
          const SizedBox(height: 12),
          const Text('WALLET BALANCE',
              style: TextStyle(fontSize: 9, letterSpacing: 1.2, color: AppColors.muted, fontWeight: FontWeight.bold)),
          Text('Rs.${_wallet.balanceRupees}',
              style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: Colors.white)),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => _push(const BillingScreen()),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Top Up Wallet'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              ),
            ),
          ),
        ]),
      );

  Widget _campaignRow(Campaign c) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              const SizedBox(height: 3),
              Text('${_compact(c.impressions)} impressions · ${_compact(c.clicks)} clicks',
                  style: const TextStyle(color: AppColors.muted, fontSize: 11)),
            ]),
          ),
          const SizedBox(width: 10),
          _StatusChip(c.status),
        ]),
      );

  Widget _stat(String label, String value, Color color) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(14)),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
              Text(label, style: const TextStyle(fontSize: 10, color: AppColors.muted)),
            ]),
      );

  static String _compact(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return '$n';
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold));
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip(this.status);

  Color get _color => switch (status) {
        'Active' => Colors.green,
        'Paused' => Colors.orange,
        'Rejected' => AppColors.red,
        _ => AppColors.gold,
      };

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration:
            BoxDecoration(color: _color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
        child: Text(status,
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _color)),
      );
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
                style: const TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w600, height: 1.2)),
          ]),
        ),
      );
}
