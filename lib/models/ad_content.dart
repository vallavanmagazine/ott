class AdContent {
  final String id;
  final String sponsor;
  final String sponsorLogo;
  final String headline;
  final String body;
  final String cta;
  final String bgImage;
  final String accent;
  final String? campaignId;

  const AdContent({
    required this.id,
    required this.sponsor,
    required this.sponsorLogo,
    required this.headline,
    required this.body,
    required this.cta,
    required this.bgImage,
    required this.accent,
    this.campaignId,
  });

  factory AdContent.fromMap(Map<String, dynamic> r) => AdContent(
        id: r['id'].toString(),
        sponsor: r['sponsor'] ?? 'Vallavan',
        sponsorLogo: r['sponsor_logo'] ?? '',
        headline: r['headline'] ?? '',
        body: r['body'] ?? '',
        cta: r['cta'] ?? 'Learn More',
        bgImage: r['bg_image'] ?? '',
        accent: r['accent'] ?? '#D32F2F',
        campaignId: r['campaign_id']?.toString(),
      );

  static const house = AdContent(
    id: 'house-vallavan',
    sponsor: 'Vallavan',
    sponsorLogo: '',
    headline: 'Documentaries That Matter — Free, for Everyone',
    body: 'Tamil-first stories. Supported by sponsors like you.',
    cta: 'Explore',
    bgImage: '30004134',
    accent: '#D32F2F',
  );
}
