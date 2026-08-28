import 'package:flutter/material.dart';
import '../../config/constants.dart';
import '../../config/theme.dart';
import '../../services/pricing_service.dart';
import 'create_campaign_screen.dart';

/// District picker with live pricing. Selecting districts here and tapping
/// "Use in a campaign" hands the selection to [CreateCampaignScreen].
class GeoTargetingScreen extends StatefulWidget {
  /// Districts already selected, when opened from campaign creation.
  final Set<String>? initial;
  const GeoTargetingScreen({super.key, this.initial});

  @override
  State<GeoTargetingScreen> createState() => _GeoTargetingScreenState();
}

class _GeoTargetingScreenState extends State<GeoTargetingScreen> {
  late Set<String> _selected = {...?widget.initial};
  List<PricingRate> _rates = const [];
  String _filter = '';

  @override
  void initState() {
    super.initState();
    PricingService.fetchPricingRates().then((r) { if (mounted) setState(() => _rates = r); });
  }

  int get _dailyRupees =>
      PricingService.dailyRateForDistricts(_selected.length, _rates) ~/ 100;

  List<String> get _visible {
    if (_filter.isEmpty) return K.tamilNaduDistricts;
    final q = _filter.toLowerCase();
    return K.tamilNaduDistricts.where((d) => d.toLowerCase().contains(q)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final all = _selected.length == K.tamilNaduDistricts.length;
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Geo Targeting', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
        actions: [
          TextButton(
            onPressed: () => setState(() {
              if (all) {
                _selected.clear();
              } else {
                _selected = {...K.tamilNaduDistricts};
              }
            }),
            child: Text(all ? 'Clear' : 'Select all',
                style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: TextField(
            style: const TextStyle(color: Colors.white, fontSize: 14),
            onChanged: (v) => setState(() => _filter = v),
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Filter districts...',
              hintStyle: const TextStyle(color: AppColors.muted, fontSize: 13),
              prefixIcon: const Icon(Icons.search, size: 18, color: AppColors.muted),
              filled: true,
              fillColor: AppColors.glass,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide.none),
            ),
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _visible.map((d) {
                final on = _selected.contains(d);
                return GestureDetector(
                  onTap: () => setState(() => on ? _selected.remove(d) : _selected.add(d)),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
                    decoration: BoxDecoration(
                      color: on ? AppColors.red : AppColors.glass,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: on ? AppColors.red : Colors.white12),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      if (on) const Icon(Icons.check, size: 13, color: Colors.white),
                      if (on) const SizedBox(width: 5),
                      Text(d,
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: on ? Colors.white : AppColors.muted)),
                    ]),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
        _pricingFooter(),
      ]),
    );
  }

  Widget _pricingFooter() => Container(
        padding: EdgeInsets.only(
            left: 16, right: 16, top: 14, bottom: MediaQuery.of(context).padding.bottom + 14),
        decoration: const BoxDecoration(
          color: AppColors.dark,
          border: Border(top: BorderSide(color: Colors.white12)),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${_selected.length} district${_selected.length == 1 ? '' : 's'} selected',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                Text(
                  _selected.isEmpty
                      ? 'Select at least one district'
                      : 'Rs.$_dailyRupees / day at this reach',
                  style: const TextStyle(color: AppColors.gold, fontSize: 12),
                ),
              ]),
            ),
            FilledButton(
              onPressed: _selected.isEmpty
                  ? null
                  : () {
                      // When opened from campaign creation, hand the selection
                      // back; when opened standalone, start a campaign with it.
                      if (widget.initial != null) {
                        Navigator.pop(context, _selected);
                      } else {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute<void>(
                            builder: (_) => CreateCampaignScreen(initialDistricts: _selected),
                          ),
                        );
                      }
                    },
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.red,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              ),
              child: Text(widget.initial != null ? 'Apply' : 'Use in a campaign',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ]),
          const SizedBox(height: 12),
          const Row(
            children: [
              _RateChip('1 district', 'Rs.99/day'),
              _RateChip('5 districts', 'Rs.199/day'),
              _RateChip('15 districts', 'Rs.399/day'),
              _RateChip('All TN', 'Rs.799/day'),
            ],
          ),
        ]),
      );
}

class _RateChip extends StatelessWidget {
  final String label;
  final String rate;
  const _RateChip(this.label, this.rate);

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 2),
          padding: const EdgeInsets.symmetric(vertical: 7),
          decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(8)),
          child: Column(children: [
            Text(rate,
                style: const TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.w900)),
            Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 8)),
          ]),
        ),
      );
}
