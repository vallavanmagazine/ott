import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/campaign.dart';
import '../../services/sponsor_service.dart';

/// Impressions, clicks and CTR per campaign, plus a district breakdown.
///
/// The bars are laid out with plain [FractionallySizedBox] widgets rather than
/// a charting package — for a single normalised horizontal series that is less
/// code than configuring a chart library, and it inherits the app theme.
class CampaignAnalyticsScreen extends StatefulWidget {
  const CampaignAnalyticsScreen({super.key});
  @override
  State<CampaignAnalyticsScreen> createState() => _CampaignAnalyticsScreenState();
}

class _CampaignAnalyticsScreenState extends State<CampaignAnalyticsScreen> {
  List<Campaign> _campaigns = [];
  List<({String district, int impressions, int clicks})> _geo = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final campaigns = await SponsorService.fetchCampaigns();
    final geo = await SponsorService.fetchGeoBreakdown();
    if (mounted) setState(() { _campaigns = campaigns; _geo = geo; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final impressions = _campaigns.fold<int>(0, (s, c) => s + c.impressions);
    final clicks = _campaigns.fold<int>(0, (s, c) => s + c.clicks);
    final spend = _campaigns.fold<int>(0, (s, c) => s + c.spendRupees);
    final ctr = impressions == 0 ? 0.0 : (clicks / impressions) * 100;

    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Campaign Analytics', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : ListView(padding: const EdgeInsets.all(16), children: [
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 1.9,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                children: [
                  _stat('Impressions', '$impressions', const Color(0xFF1565C0)),
                  _stat('Clicks', '$clicks', const Color(0xFF00838F)),
                  _stat('CTR', '${ctr.toStringAsFixed(2)}%', AppColors.gold),
                  _stat('Total Spend', 'Rs.$spend', AppColors.red),
                ],
              ),
              const SizedBox(height: 24),
              const _Label('BY CAMPAIGN'),
              const SizedBox(height: 10),
              if (_campaigns.isEmpty)
                const _Empty('No campaign data yet.')
              else
                ..._campaignBars(),
              const SizedBox(height: 26),
              const _Label('BY DISTRICT'),
              const SizedBox(height: 10),
              if (_geo.isEmpty)
                const _Empty('No district-level events recorded yet.')
              else
                ..._geoBars(),
              const SizedBox(height: 24),
            ]),
    );
  }

  List<Widget> _campaignBars() {
    // Normalise against the busiest campaign so the widest bar fills the row.
    final peak = _campaigns.fold<int>(1, (m, c) => c.impressions > m ? c.impressions : m);
    return _campaigns.map((c) {
      final ctr = c.impressions == 0 ? 0.0 : (c.clicks / c.impressions) * 100;
      return _BarRow(
        label: c.name,
        sublabel: '${c.impressions} impressions · ${c.clicks} clicks · ${ctr.toStringAsFixed(2)}% CTR',
        fraction: (c.impressions / peak).clamp(0.02, 1.0),
        color: AppColors.red,
      );
    }).toList();
  }

  List<Widget> _geoBars() {
    final peak = _geo.fold<int>(1, (m, g) => g.impressions > m ? g.impressions : m);
    return _geo.take(15).map((g) {
      final ctr = g.impressions == 0 ? 0.0 : (g.clicks / g.impressions) * 100;
      return _BarRow(
        label: g.district,
        sublabel: '${g.impressions} impressions · ${g.clicks} clicks · ${ctr.toStringAsFixed(2)}% CTR',
        fraction: (g.impressions / peak).clamp(0.02, 1.0),
        color: AppColors.gold,
      );
    }).toList();
  }

  Widget _stat(String label, String value, Color color) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(14)),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FittedBox(
                child: Text(value,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
              ),
              Text(label, style: const TextStyle(fontSize: 10, color: AppColors.muted)),
            ]),
      );
}

class _BarRow extends StatelessWidget {
  final String label;
  final String sublabel;
  final double fraction;
  final Color color;
  const _BarRow({
    required this.label,
    required this.sublabel,
    required this.fraction,
    required this.color,
  });

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: Container(
              height: 8,
              color: AppColors.glass,
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: fraction,
                child: Container(color: color),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(sublabel, style: const TextStyle(color: AppColors.muted, fontSize: 10)),
        ]),
      );
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold));
}

class _Empty extends StatelessWidget {
  final String text;
  const _Empty(this.text);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Center(child: Text(text, style: const TextStyle(color: AppColors.muted, fontSize: 12))),
      );
}
