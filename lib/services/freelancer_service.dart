import '../utils/video.dart';
import 'supabase_client.dart';
import 'auth_phone_service.dart';

class FreelancerTask {
  final String id;
  final String title;
  final String? description;
  final String? contentType;
  final List<String> rolesNeeded;
  final String? location;
  const FreelancerTask({
    required this.id,
    required this.title,
    this.description,
    this.contentType,
    this.rolesNeeded = const [],
    this.location,
  });

  factory FreelancerTask.fromMap(Map<String, dynamic> r) => FreelancerTask(
        id: r['id'].toString(),
        title: (r['title'] ?? '').toString(),
        description: r['description']?.toString(),
        contentType: r['content_type']?.toString(),
        rolesNeeded: ((r['roles_needed'] ?? []) as List).map((e) => e.toString()).toList(),
        location: r['location']?.toString(),
      );
}

/// Freelancer enrolment + tasks, mirroring the web `services/freelancer.ts`.
class FreelancerService {
  static const List<String> roles = ['Reporter', 'Anchor', 'Writer', 'Visual Editor', 'Program Producer', 'Telecaller', 'Field Executive'];
  /// Ad-marketing roles (sell ads, create campaigns + payment links for sponsors).
  static const List<String> adSalesRoles = ['Telecaller', 'Field Executive'];
  static const int enrollmentFeeRupees = 1499;

  /// Submit an application. Returns null on success, an error string otherwise.
  /// Fields mirror the web FreelancerCareerScreen exactly (FIX 3).
  static Future<String?> apply({
    required String name,
    required String email,
    required String phone,
    required List<String> selectedRoles,
    String? district,
    int experienceYears = 0,
    String? portfolioUrl,
    String? showreelUrl,
    String? resumeUrl,
  }) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    if (name.trim().isEmpty || email.trim().isEmpty || phone.trim().isEmpty || selectedRoles.isEmpty) {
      return 'Name, phone, email and at least one role are required';
    }
    try {
      await c.from('freelancers').insert({
        'name': name.trim(),
        'email': email.trim(),
        'phone': phone.trim(),
        'roles': selectedRoles,
        'district': district,
        'experience_years': experienceYears,
        'portfolio_url': portfolioUrl,
        'showreel_url': showreelUrl,
        'resume_url': resumeUrl,
        'status': 'pending',
      });
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  static Future<List<FreelancerTask>> fetchOpenTasks() async {
    final c = Db.client;
    if (c == null) return [];
    try {
      final data = await c.from('freelancer_tasks').select().eq('status', 'open').order('created_at', ascending: false);
      return (data as List).map((r) => FreelancerTask.fromMap(r as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  /// The current user's freelancer profile. Prefers the phone session's
  /// freelancerId; falls back to Supabase Auth (admin-linked).
  static Future<Map<String, dynamic>?> fetchMyProfile() async {
    final c = Db.client;
    if (c == null) return null;
    try {
      final session = await AuthPhone.currentSession();
      if (session?.freelancerId != null) {
        return await c.from('freelancers').select().eq('id', session!.freelancerId!).maybeSingle();
      }
      final user = c.auth.currentUser;
      if (user == null) return null;
      return await c.from('freelancers').select().eq('user_id', user.id).maybeSingle();
    } catch (_) {
      return null;
    }
  }

  // --- Section C3–C6 ---
  static const int magazineCostRupees = 14;
  static const int magazineSellRupees = 20;
  static const double adSalesCommission = 0.20;

  static Future<String?> _myFreelancerId() async {
    final p = await fetchMyProfile();
    return p?['id']?.toString();
  }

  /// Earnings rows + paid/pending totals.
  static Future<({List<Map<String, dynamic>> rows, int paid, int pending})> fetchEarnings() async {
    final c = Db.client;
    if (c == null) return (rows: <Map<String, dynamic>>[], paid: 0, pending: 0);
    final fid = await _myFreelancerId();
    if (fid == null) return (rows: <Map<String, dynamic>>[], paid: 0, pending: 0);
    try {
      final data = await c.from('freelancer_earnings').select().eq('freelancer_id', fid).order('created_at', ascending: false);
      final rows = (data as List).cast<Map<String, dynamic>>();
      int paid = 0, pending = 0;
      for (final r in rows) {
        final amt = ((r['amount_paise'] ?? 0) as num).toInt() ~/ 100;
        if (r['status'] == 'paid') { paid += amt; } else { pending += amt; }
      }
      return (rows: rows, paid: paid, pending: pending);
    } catch (_) {
      return (rows: <Map<String, dynamic>>[], paid: 0, pending: 0);
    }
  }

  static Future<List<Map<String, dynamic>>> fetchMyAssignments() async {
    final c = Db.client;
    if (c == null) return [];
    final fid = await _myFreelancerId();
    if (fid == null) return [];
    try {
      final data = await c.from('task_assignments').select('*, freelancer_tasks(title)').eq('freelancer_id', fid).order('created_at', ascending: false);
      return (data as List).cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  static Future<String?> submitContent(
    String assignmentId,
    String contentUrl, {
    String? thumbnailUrl,
    String? notes,
  }) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    try {
      // Normalise at the write boundary, exactly as the web CMS does in
      // services/admin-writes.ts: a freelancer pastes whatever YouTube hands
      // them (usually /shorts/ or watch?v=), and every consumer downstream —
      // the web player's iframe above all — needs the canonical /embed/ form.
      // Idempotent, and MP4/HLS/DyneTube links pass through untouched.
      final normalisedUrl = toEmbedUrl(contentUrl) ?? contentUrl;
      // A YouTube submission always has a derivable poster, so an omitted
      // thumbnail costs the reviewer nothing rather than showing a blank card.
      final thumb = (thumbnailUrl != null && thumbnailUrl.isNotEmpty)
          ? thumbnailUrl
          : autoThumbnail(normalisedUrl);

      await c.from('task_assignments').update({
        'content_url': normalisedUrl,
        if (thumb != null && thumb.isNotEmpty) 'thumbnail_url': thumb,
        'notes': notes,
        'status': 'submitted',
        'submitted_at': DateTime.now().toIso8601String(),
      }).eq('id', assignmentId);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  /// Claim an open task. Creates the assignment row and flips the task to
  /// 'assigned' so it stops appearing in the open list for everyone else.
  ///
  /// This is a two-step write without a transaction, so a rare race can leave
  /// a task claimed twice; the admin review step catches that. Guarding the
  /// common case (already claimed by this freelancer) is done up front.
  static Future<String?> claimTask(FreelancerTask task, {String? role}) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    final profile = await fetchMyProfile();
    final fid = profile?['id']?.toString();
    if (fid == null) return 'Complete your freelancer registration first.';
    if ((profile?['status'] ?? '').toString().toLowerCase() == 'rejected') {
      return 'Your application was not approved. Contact support for details.';
    }

    try {
      final existing = await c
          .from('task_assignments')
          .select('id')
          .eq('task_id', task.id)
          .eq('freelancer_id', fid)
          .maybeSingle();
      if (existing != null) return 'You have already picked up this task.';

      await c.from('task_assignments').insert({
        'task_id': task.id,
        'freelancer_id': fid,
        'role': role ?? (task.rolesNeeded.isNotEmpty ? task.rolesNeeded.first : null),
        'status': 'assigned',
      });
      await c.from('freelancer_tasks').update({'status': 'assigned'}).eq('id', task.id);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  /// Update the freelancer's own profile details.
  static Future<String?> updateProfile({
    required String name,
    required String email,
    required String district,
    required List<String> roles,
    String? portfolioUrl,
    String? showreelUrl,
    String? resumeUrl,
  }) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    final fid = await _myFreelancerId();
    if (fid == null) return 'No freelancer profile found.';
    if (name.trim().isEmpty) return 'Name is required.';
    if (roles.isEmpty) return 'Pick at least one role.';
    try {
      await c.from('freelancers').update({
        'name': name.trim(),
        'email': email.trim(),
        'district': district,
        'roles': roles,
        'portfolio_url': portfolioUrl,
        'showreel_url': showreelUrl,
        'resume_url': resumeUrl,
      }).eq('id', fid);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  static Future<String?> createMagazineOrder(int quantity) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    final fid = await _myFreelancerId();
    if (fid == null) return 'Approved freelancer profile required';
    try {
      await c.from('magazine_orders').insert({
        'freelancer_id': fid, 'quantity': quantity,
        'unit_price_paise': magazineCostRupees * 100, 'total_paise': quantity * magazineCostRupees * 100, 'status': 'ordered',
      });
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  static Future<List<Map<String, dynamic>>> fetchMagazineOrders() async {
    final c = Db.client;
    if (c == null) return [];
    final fid = await _myFreelancerId();
    if (fid == null) return [];
    try {
      final data = await c.from('magazine_orders').select().eq('freelancer_id', fid).order('created_at', ascending: false);
      return (data as List).cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  static Future<String?> logAdSale(String businessName, int saleRupees) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    final fid = await _myFreelancerId();
    if (fid == null) return 'Approved freelancer profile required';
    final commission = (saleRupees * adSalesCommission).round();
    try {
      await c.from('ad_sales_log').insert({
        'freelancer_id': fid, 'business_name': businessName,
        'sale_amount_paise': saleRupees * 100, 'commission_paise': commission * 100,
        'commission_rate': adSalesCommission, 'status': 'pending',
      });
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  static Future<List<Map<String, dynamic>>> fetchAdSales() async {
    final c = Db.client;
    if (c == null) return [];
    final fid = await _myFreelancerId();
    if (fid == null) return [];
    try {
      final data = await c.from('ad_sales_log').select().eq('freelancer_id', fid).order('created_at', ascending: false);
      return (data as List).cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }
}
