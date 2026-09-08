import '../models/ad_content.dart';
import '../models/campaign.dart';
import '../utils/identity.dart';
import 'auth_phone_service.dart';
import 'supabase_client.dart';

/// Sponsor account, campaigns, ad creatives and analytics.
/// Mirrors the web `services/sponsor.ts`.
class SponsorService {
  // ------------------------------------------------------------- identity

  /// Resolve the current user's sponsor id. Prefers the phone session; falls
  /// back to Supabase Auth (admin-linked sponsor).
  static Future<String?> currentSponsorId() async {
    final session = await AuthPhone.currentSession();
    if (session?.sponsorId != null) return session!.sponsorId;
    final c = Db.client;
    final user = c?.auth.currentUser;
    if (c == null || user == null) return null;
    try {
      final s = await c.from('sponsors').select('id').eq('owner_id', user.id).maybeSingle();
      return s?['id']?.toString();
    } catch (_) {
      return null;
    }
  }

  static Future<Map<String, dynamic>?> fetchProfile() async {
    final c = Db.client;
    final id = await currentSponsorId();
    if (c == null || id == null) return null;
    try {
      return await c.from('sponsors').select().eq('id', id).maybeSingle();
    } catch (_) {
      return null;
    }
  }

  /// Business-record registration. Idempotent by email.
  static Future<String?> register({
    required String businessName,
    required String ownerName,
    required String phone,
    required String email,
    required String businessType,
    required String district,
    String? gstNumber,
  }) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    if (businessName.trim().isEmpty ||
        ownerName.trim().isEmpty ||
        phone.trim().length < 10 ||
        email.trim().isEmpty) {
      return 'Business name, owner, a valid phone, and email are required';
    }
    final em = normEmail(email);
    final payload = {
      'name': businessName.trim(),
      'owner_name': ownerName.trim(),
      'phone': normPhone(phone),
      'email': em,
      'business_type': businessType,
      'district': district,
      'gst_number': (gstNumber != null && gstNumber.trim().isNotEmpty) ? gstNumber.trim() : null,
      'owner_id': c.auth.currentUser?.id,
    };
    try {
      final existing = await c.from('sponsors').select('id').ilike('email', em).maybeSingle();
      if (existing != null && existing['id'] != null) {
        await c.from('sponsors').update(payload).eq('id', existing['id']);
      } else {
        await c.from('sponsors').insert(payload);
      }
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  // ------------------------------------------------------------ campaigns

  static Future<List<Campaign>> fetchCampaigns() async {
    final c = Db.client;
    final id = await currentSponsorId();
    if (c == null || id == null) return const [];
    try {
      final data =
          await c.from('campaigns').select().eq('sponsor_id', id).order('created_at', ascending: false);
      final rows = (data as List).cast<Map<String, dynamic>>();

      // Impressions/clicks are computed LIVE from ad_events — the single source
      // of truth. campaigns.impressions/clicks is never populated by anything,
      // so reading it renders 0. We overlay the real counts onto each row
      // before mapping (Campaign.fromMap reads r['impressions']/r['clicks']),
      // which fixes both the dashboard overview tiles and the "By Campaign"
      // bars with no widget changes. Same approach as fetchGeoBreakdown, keyed
      // by campaign instead of district. If a campaign has no events (or the
      // events read fails), its stored column value is left untouched.
      final metrics = await _campaignMetrics(rows.map((r) => r['id'].toString()).toList());
      for (final r in rows) {
        final m = metrics[r['id'].toString()];
        if (m != null) {
          r['impressions'] = m.impressions;
          r['clicks'] = m.clicks;
        }
      }
      return rows.map(Campaign.fromMap).toList();
    } catch (_) {
      return const [];
    }
  }

  /// Per-campaign impression/click tallies computed live from ad_events.
  ///
  /// PostgREST has no GROUP BY, so we group client-side over the sponsor's
  /// events — the same technique used by [fetchGeoBreakdown] and the web admin
  /// analytics. Impressions are every non-'click' event (kind='impression').
  /// Returns an empty map (never throws) so callers degrade to stored values.
  static Future<Map<String, ({int impressions, int clicks})>> _campaignMetrics(
      List<String> campaignIds) async {
    final c = Db.client;
    if (c == null || campaignIds.isEmpty) return const {};
    try {
      final events =
          await c.from('ad_events').select('campaign_id, kind').inFilter('campaign_id', campaignIds);
      final imp = <String, int>{};
      final clk = <String, int>{};
      for (final e in events as List) {
        final cid = e['campaign_id']?.toString();
        if (cid == null) continue;
        if (e['kind'] == 'click') {
          clk[cid] = (clk[cid] ?? 0) + 1;
        } else {
          imp[cid] = (imp[cid] ?? 0) + 1;
        }
      }
      final out = <String, ({int impressions, int clicks})>{};
      for (final cid in {...imp.keys, ...clk.keys}) {
        out[cid] = (impressions: imp[cid] ?? 0, clicks: clk[cid] ?? 0);
      }
      return out;
    } catch (_) {
      return const {};
    }
  }

  /// Create a campaign. Returns null on success, an error string otherwise.
  static Future<String?> createCampaign({
    required String name,
    required List<String> districts,
    required int budgetRupees,
    required int days,
    String? creativeAdId,
  }) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    final sponsorId = await currentSponsorId();
    if (sponsorId == null) return 'No sponsor profile linked to this account.';
    if (name.trim().isEmpty) return 'Please name your campaign.';
    if (districts.isEmpty) return 'Select at least one district to target.';

    final start = DateTime.now();
    try {
      await c.from('campaigns').insert({
        'sponsor_id': sponsorId,
        'name': name.trim(),
        'status': 'Pending Approval',
        'budget_paise': budgetRupees * 100,
        'target_districts': districts,
        'ad_id': creativeAdId,
        'start_date': start.toIso8601String().substring(0, 10),
        'end_date': start.add(Duration(days: days)).toIso8601String().substring(0, 10),
        'submitted_at': start.toIso8601String(),
      });
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  static Future<String?> setCampaignStatus(String id, String status) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    try {
      await c.from('campaigns').update({'status': status}).eq('id', id);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  // ------------------------------------------------------------ creatives

  static Future<List<AdContent>> fetchCreatives() async {
    final c = Db.client;
    final id = await currentSponsorId();
    if (c == null || id == null) return const [];
    try {
      final data =
          await c.from('ads').select().eq('sponsor_id', id).order('created_at', ascending: false);
      return (data as List).map((r) => AdContent.fromMap(r as Map<String, dynamic>)).toList();
    } catch (_) {
      return const [];
    }
  }

  static Future<String?> createCreative({
    required String sponsorName,
    required String headline,
    required String body,
    required String cta,
    required String bgImage,
    String accent = '#D32F2F',
  }) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    final id = await currentSponsorId();
    if (id == null) return 'No sponsor profile linked to this account.';
    if (headline.trim().isEmpty) return 'A headline is required.';
    try {
      await c.from('ads').insert({
        'sponsor': sponsorName,
        'sponsor_id': id,
        'sponsor_logo': '',
        'headline': headline.trim(),
        'body': body.trim(),
        'cta': cta.trim().isEmpty ? 'Learn More' : cta.trim(),
        'bg_image': bgImage.trim(),
        'accent': accent,
      });
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  static Future<String?> updateCreative(
    String adId, {
    required String headline,
    required String body,
    required String cta,
    required String bgImage,
  }) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    try {
      await c.from('ads').update({
        'headline': headline.trim(),
        'body': body.trim(),
        'cta': cta.trim(),
        'bg_image': bgImage.trim(),
      }).eq('id', adId);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  static Future<String?> deleteCreative(String adId) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    try {
      await c.from('ads').delete().eq('id', adId);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  // ------------------------------------------------------------ analytics

  /// Per-district impression/click rollup, newest campaigns first.
  static Future<List<({String district, int impressions, int clicks})>> fetchGeoBreakdown() async {
    final c = Db.client;
    final id = await currentSponsorId();
    if (c == null || id == null) return const [];
    try {
      final campaigns = await c.from('campaigns').select('id').eq('sponsor_id', id);
      final ids = (campaigns as List).map((e) => e['id'].toString()).toList();
      if (ids.isEmpty) return const [];

      final events =
          await c.from('ad_events').select('district, kind').inFilter('campaign_id', ids);
      final imp = <String, int>{};
      final clk = <String, int>{};
      for (final e in events as List) {
        final d = (e['district'] ?? 'Unknown').toString();
        if (e['kind'] == 'click') {
          clk[d] = (clk[d] ?? 0) + 1;
        } else {
          imp[d] = (imp[d] ?? 0) + 1;
        }
      }
      final districts = {...imp.keys, ...clk.keys}.toList()
        ..sort((a, b) => (imp[b] ?? 0).compareTo(imp[a] ?? 0));
      return districts
          .map((d) => (district: d, impressions: imp[d] ?? 0, clicks: clk[d] ?? 0))
          .toList();
    } catch (_) {
      return const [];
    }
  }
}
