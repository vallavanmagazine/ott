import 'supabase_client.dart';

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
  static const List<String> roles = ['Reporter', 'Anchor', 'Writer', 'Visual Editor', 'Program Producer'];
  static const int enrollmentFeeRupees = 1499;

  /// Submit an application. Returns null on success, an error string otherwise.
  static Future<String?> apply({
    required String name,
    required String email,
    required String phone,
    required List<String> selectedRoles,
    String? district,
  }) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    if (name.trim().isEmpty || email.trim().isEmpty || selectedRoles.isEmpty) {
      return 'Name, email and at least one role are required';
    }
    try {
      await c.from('freelancers').insert({
        'name': name.trim(),
        'email': email.trim(),
        'phone': phone.trim(),
        'roles': selectedRoles,
        'district': district,
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

  /// The current signed-in user's freelancer profile, or null.
  static Future<Map<String, dynamic>?> fetchMyProfile() async {
    final c = Db.client;
    if (c == null) return null;
    final user = c.auth.currentUser;
    if (user == null) return null;
    try {
      final row = await c.from('freelancers').select().eq('user_id', user.id).maybeSingle();
      return row;
    } catch (_) {
      return null;
    }
  }
}
