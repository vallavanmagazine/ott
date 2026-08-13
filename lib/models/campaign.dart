import '../utils/formatters.dart';

class Campaign {
  final String id;
  final String name;
  final String status;
  final int impressions;
  final int clicks;
  final int spendRupees;
  final String startDate;
  final List<String> targetDistricts;

  const Campaign({
    required this.id,
    required this.name,
    required this.status,
    required this.impressions,
    required this.clicks,
    required this.spendRupees,
    required this.startDate,
    this.targetDistricts = const [],
  });

  factory Campaign.fromMap(Map<String, dynamic> r) => Campaign(
        id: r['id'].toString(),
        name: r['name'] ?? '',
        status: r['status'] ?? 'Draft',
        impressions: (r['impressions'] ?? 0) as int,
        clicks: (r['clicks'] ?? 0) as int,
        spendRupees: paiseToRupees((r['spend_paise'] ?? 0) as num),
        startDate: r['start_date'] != null ? formatDate(r['start_date'].toString()) : '—',
        targetDistricts: (r['target_districts'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      );
}
