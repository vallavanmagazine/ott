import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/campaign.dart';
import '../../services/sponsor_service.dart';
import 'create_campaign_screen.dart';

/// All campaigns for the signed-in sponsor, with pause/resume controls.
class MyCampaignsScreen extends StatefulWidget {
  const MyCampaignsScreen({super.key});
  @override
  State<MyCampaignsScreen> createState() => _MyCampaignsScreenState();
}

class _MyCampaignsScreenState extends State<MyCampaignsScreen> {
  List<Campaign> _campaigns = [];
  bool _loading = true;
  String _filter = 'All';

  static const _filters = ['All', 'Active', 'Paused', 'Pending Approval'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await SponsorService.fetchCampaigns();
    if (mounted) setState(() { _campaigns = list; _loading = false; });
  }

  Future<void> _toggle(Campaign c) async {
    final next = c.status == 'Active' ? 'Paused' : 'Active';
    final err = await SponsorService.setCampaignStatus(c.id, next);
    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not update: $err')));
      return;
    }
    _load();
  }

  List<Campaign> get _visible =>
      _filter == 'All' ? _campaigns : _campaigns.where((c) => c.status == _filter).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('My Campaigns', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.red,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute<void>(builder: (_) => const CreateCampaignScreen()));
          if (mounted) _load();
        },
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('New', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : Column(children: [
              SizedBox(
                height: 46,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  children: _filters.map((f) {
                    final on = _filter == f;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () => setState(() => _filter = f),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: on ? AppColors.red : AppColors.glass,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(f,
                              style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: on ? Colors.white : AppColors.muted)),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              Expanded(
                child: _visible.isEmpty
                    ? Center(
                        child: Text(_filter == 'All' ? 'No campaigns yet' : 'No $_filter campaigns',
                            style: const TextStyle(color: AppColors.muted)),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 90),
                        itemCount: _visible.length,
                        itemBuilder: (_, i) => _card(_visible[i]),
                      ),
              ),
            ]),
    );
  }

  Widget _card(Campaign c) {
    final ctr = c.impressions == 0 ? 0.0 : (c.clicks / c.impressions) * 100;
    final canToggle = c.status == 'Active' || c.status == 'Paused';
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.glass,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Text(c.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15)),
          ),
          _statusChip(c.status),
        ]),
        const SizedBox(height: 8),
        Row(children: [
          _metric('Impressions', '${c.impressions}'),
          _metric('Clicks', '${c.clicks}'),
          _metric('CTR', '${ctr.toStringAsFixed(2)}%'),
          _metric('Spend', 'Rs.${c.spendRupees}'),
        ]),
        const SizedBox(height: 10),
        Row(children: [
          const Icon(Icons.place_outlined, size: 13, color: AppColors.muted),
          const SizedBox(width: 5),
          Expanded(
            child: Text(
              c.targetDistricts.isEmpty
                  ? 'All Tamil Nadu'
                  : '${c.targetDistricts.length} district${c.targetDistricts.length == 1 ? '' : 's'} · ${c.targetDistricts.take(3).join(', ')}${c.targetDistricts.length > 3 ? '...' : ''}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.muted, fontSize: 11),
            ),
          ),
        ]),
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text('Starts ${c.startDate}', style: const TextStyle(color: AppColors.muted, fontSize: 11)),
        ),
        if (canToggle) ...[
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _toggle(c),
              icon: Icon(c.status == 'Active' ? Icons.pause : Icons.play_arrow, size: 16),
              label: Text(c.status == 'Active' ? 'Pause Campaign' : 'Resume Campaign'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white24),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              ),
            ),
          ),
        ],
      ]),
    );
  }

  Widget _metric(String label, String value) => Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 9)),
        ]),
      );

  Widget _statusChip(String status) {
    final color = switch (status) {
      'Active' => Colors.green,
      'Paused' => Colors.orange,
      'Rejected' => AppColors.red,
      _ => AppColors.gold,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
      child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
    );
  }
}
