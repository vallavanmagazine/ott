import 'package:flutter/material.dart';
import '../../config/constants.dart';
import '../../config/theme.dart';
import '../../models/ad_content.dart';
import '../../services/pricing_service.dart';
import '../../services/sponsor_service.dart';
import '../../services/wallet_service.dart';
import 'ai_studio_screen.dart';
import 'geo_targeting_screen.dart';
import 'wallet_topup_screen.dart';

/// Create a campaign: name, creative, districts, duration.
///
/// Total cost is derived, not typed — the daily rate comes from the district
/// count via the pricing tiers, so the sponsor cannot submit a budget that
/// disagrees with what the campaign will actually consume.
class CreateCampaignScreen extends StatefulWidget {
  final Set<String>? initialDistricts;
  const CreateCampaignScreen({super.key, this.initialDistricts});

  @override
  State<CreateCampaignScreen> createState() => _CreateCampaignScreenState();
}

class _CreateCampaignScreenState extends State<CreateCampaignScreen> {
  final _name = TextEditingController();
  late Set<String> _districts = {...?widget.initialDistricts};
  int _days = 7;
  AdContent? _creative;
  List<AdContent> _creatives = const [];
  List<PricingRate> _rates = const [];
  int _balance = 0;
  bool _submitting = false;
  String? _error;

  static const _dayOptions = [3, 7, 15, 30];

  @override
  void initState() {
    super.initState();
    if (_districts.isEmpty) _districts = {'Chennai'};
    _load();
  }

  Future<void> _load() async {
    final rates = await PricingService.fetchPricingRates();
    final creatives = await SponsorService.fetchCreatives();
    final wallet = await WalletService.fetch();
    if (!mounted) return;
    setState(() {
      _rates = rates;
      _creatives = creatives;
      _balance = wallet.balanceRupees;
      if (creatives.isNotEmpty) _creative = creatives.first;
    });
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  int get _dailyRupees => PricingService.dailyRateForDistricts(_districts.length, _rates) ~/ 100;
  int get _totalRupees => _dailyRupees * _days;
  bool get _affordable => _balance >= _totalRupees;

  Future<void> _pickDistricts() async {
    final result = await Navigator.push<Set<String>>(
      context,
      MaterialPageRoute(builder: (_) => GeoTargetingScreen(initial: _districts)),
    );
    if (result != null && mounted) setState(() => _districts = result);
  }

  Future<void> _submit() async {
    setState(() { _error = null; _submitting = true; });

    final err = await SponsorService.createCampaign(
      name: _name.text,
      districts: _districts.toList(),
      budgetRupees: _totalRupees,
      days: _days,
      creativeAdId: _creative?.id,
    );

    if (!mounted) return;
    setState(() => _submitting = false);
    if (err != null) {
      setState(() => _error = err);
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Campaign submitted for approval.')),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Create Campaign', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const _Label('CAMPAIGN NAME'),
        const SizedBox(height: 8),
        TextField(
          controller: _name,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'e.g. Deepavali Gold Offer',
            hintStyle: const TextStyle(color: AppColors.muted, fontSize: 13),
            filled: true,
            fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 22),
        const _Label('AD CREATIVE'),
        const SizedBox(height: 8),
        if (_creatives.isEmpty)
          _emptyCreatives()
        else
          SizedBox(
            height: 92,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _creatives.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) {
                final ad = _creatives[i];
                final on = _creative?.id == ad.id;
                return GestureDetector(
                  onTap: () => setState(() => _creative = ad),
                  child: Container(
                    width: 190,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.glass,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: on ? AppColors.red : Colors.white12, width: on ? 2 : 1),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(ad.headline,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      const Spacer(),
                      Text(ad.cta, style: const TextStyle(color: AppColors.gold, fontSize: 10)),
                    ]),
                  ),
                );
              },
            ),
          ),
        const SizedBox(height: 22),
        const _Label('TARGET DISTRICTS'),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickDistricts,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
            child: Row(children: [
              const Icon(Icons.map_outlined, size: 18, color: AppColors.gold),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(
                    _districts.length == K.tamilNaduDistricts.length
                        ? 'All Tamil Nadu'
                        : '${_districts.length} district${_districts.length == 1 ? '' : 's'}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  Text(_districts.take(4).join(', ') + (_districts.length > 4 ? '...' : ''),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                ]),
              ),
              const Icon(Icons.chevron_right, color: AppColors.muted),
            ]),
          ),
        ),
        const SizedBox(height: 22),
        const _Label('DURATION'),
        const SizedBox(height: 8),
        Row(
          children: _dayOptions.map((d) {
            final on = _days == d;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _days = d),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: on ? AppColors.red : AppColors.glass,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(children: [
                    Text('$d',
                        style: TextStyle(
                            color: on ? Colors.white : Colors.white70,
                            fontWeight: FontWeight.w900,
                            fontSize: 15)),
                    Text('days',
                        style: TextStyle(
                            color: on ? Colors.white70 : AppColors.muted, fontSize: 9)),
                  ]),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 22),
        _costSummary(),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 14),
            child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12)),
          ),
        const SizedBox(height: 18),
        if (!_affordable)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: OutlinedButton.icon(
              onPressed: () async {
                await Navigator.push(context,
                    MaterialPageRoute<void>(builder: (_) => const WalletTopUpScreen()));
                if (mounted) _load();
              },
              icon: const Icon(Icons.account_balance_wallet, size: 16),
              label: Text('Top up — Rs.${_totalRupees - _balance} short'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.gold,
                side: const BorderSide(color: AppColors.gold),
                minimumSize: const Size.fromHeight(46),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              ),
            ),
          ),
        FilledButton(
          onPressed: _submitting ? null : _submit,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.red,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          ),
          child: Text(_submitting ? 'Submitting...' : 'Launch Campaign',
              style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
        const Padding(
          padding: EdgeInsets.only(top: 10),
          child: Text('Campaigns go live after a short review by the Vallavan team.',
              textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted, fontSize: 10)),
        ),
        const SizedBox(height: 24),
      ]),
    );
  }

  Widget _emptyCreatives() => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          const Expanded(
            child: Text('No creatives yet. Generate one in AI Studio.',
                style: TextStyle(color: AppColors.muted, fontSize: 12)),
          ),
          TextButton(
            onPressed: () async {
              await Navigator.push(context, MaterialPageRoute<void>(builder: (_) => const AiStudioScreen()));
              if (mounted) _load();
            },
            child: const Text('AI Studio',
                style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ]),
      );

  Widget _costSummary() => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
        ),
        child: Column(children: [
          _costRow('Daily rate (${_districts.length} districts)', 'Rs.$_dailyRupees'),
          const SizedBox(height: 6),
          _costRow('Duration', '$_days days'),
          const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(color: Colors.white12, height: 1)),
          Row(children: [
            const Expanded(
              child: Text('Total',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15)),
            ),
            Text('Rs.$_totalRupees',
                style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 20)),
          ]),
          const SizedBox(height: 6),
          Row(children: [
            Expanded(
              child: Text('Wallet balance: Rs.$_balance',
                  style: const TextStyle(color: AppColors.muted, fontSize: 11)),
            ),
            Text(_affordable ? 'Covered' : 'Insufficient',
                style: TextStyle(
                    color: _affordable ? Colors.green : AppColors.red,
                    fontSize: 11,
                    fontWeight: FontWeight.bold)),
          ]),
        ]),
      );

  Widget _costRow(String label, String value) => Row(children: [
        Expanded(child: Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12))),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
      ]);
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold));
}
