import 'supabase_client.dart';

/// A single district-count → daily-rate tier.
class PricingRate {
  final int districtCount;
  final int ratePaise;
  const PricingRate(this.districtCount, this.ratePaise);
  int get rupees => ratePaise ~/ 100;
}

/// Inspire PR video package (Spotlight / Prestige).
class InspirePackage {
  final String name;
  final int pricePaise;
  final String? description;
  const InspirePackage(this.name, this.pricePaise, this.description);
  int get rupees => pricePaise ~/ 100;
}

/// Pricing + wallet-bonus logic, mirroring the web `services/pricing.ts`.
class PricingService {
  static const int minTopupRupees = 999;
  static const List<int> topupPresets = [999, 2999, 4999, 9999];

  /// Fallback tiers used when Supabase is unconfigured or empty.
  static const List<PricingRate> _fallbackRates = [
    PricingRate(1, 9900),
    PricingRate(5, 19900),
    PricingRate(15, 39900),
    PricingRate(36, 79900),
  ];

  static Future<List<PricingRate>> fetchPricingRates() async {
    final c = Db.client;
    if (c == null) return _fallbackRates;
    try {
      final data = await c.from('pricing_rates').select().order('district_count', ascending: true);
      final rows = (data as List)
          .map((r) => PricingRate(
                (r['district_count'] as num).toInt(),
                (r['rate_paise'] as num).toInt(),
              ))
          .toList();
      return rows.isEmpty ? _fallbackRates : rows;
    } catch (_) {
      return _fallbackRates;
    }
  }

  static Future<List<InspirePackage>> fetchInspirePackages() async {
    final c = Db.client;
    if (c == null) return _fallbackInspire;
    try {
      final data = await c.from('inspire_packages').select().order('price_paise', ascending: true);
      final rows = (data as List)
          .map((r) => InspirePackage(
                (r['name'] ?? '').toString(),
                (r['price_paise'] as num).toInt(),
                r['description']?.toString(),
              ))
          .toList();
      return rows.isEmpty ? _fallbackInspire : rows;
    } catch (_) {
      return _fallbackInspire;
    }
  }

  static const List<InspirePackage> _fallbackInspire = [
    InspirePackage('Spotlight', 999900, 'Professional PR video feature'),
    InspirePackage('Prestige', 2500000, 'Premium PR video + priority placement'),
  ];

  /// Daily rate (paise) for a given number of targeted districts.
  static int dailyRateForDistricts(int count, List<PricingRate> rates) {
    if (rates.isEmpty) return _fallbackRates.first.ratePaise;
    final sorted = [...rates]..sort((a, b) => a.districtCount.compareTo(b.districtCount));
    PricingRate chosen = sorted.first;
    for (final r in sorted) {
      if (count >= r.districtCount) chosen = r;
    }
    return chosen.ratePaise;
  }

  /// Wallet top-up bonus percentage: ₹25k→30%, ₹10k→20%, ₹5k→10%.
  static int walletBonusPercent(int amountRupees) {
    if (amountRupees >= 25000) return 30;
    if (amountRupees >= 10000) return 20;
    if (amountRupees >= 5000) return 10;
    return 0;
  }

  static int walletBonusRupees(int amountRupees) => (amountRupees * walletBonusPercent(amountRupees)) ~/ 100;
}
