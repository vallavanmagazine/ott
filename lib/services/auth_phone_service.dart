import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/env.dart';
import 'supabase_client.dart';

/// Phone-OTP session (sponsor/freelancer). Stored in SharedPreferences.
class PhoneSession {
  final String userId, name, phone, email, role;
  final String? sponsorId, freelancerId;
  const PhoneSession({required this.userId, required this.name, required this.phone, required this.email, required this.role, this.sponsorId, this.freelancerId});

  Map<String, dynamic> toJson() => {'userId': userId, 'name': name, 'phone': phone, 'email': email, 'role': role, 'sponsorId': sponsorId, 'freelancerId': freelancerId};
  factory PhoneSession.fromJson(Map<String, dynamic> j) => PhoneSession(
        userId: j['userId'], name: j['name'] ?? '', phone: j['phone'] ?? '', email: j['email'] ?? '', role: j['role'] ?? '',
        sponsorId: j['sponsorId'], freelancerId: j['freelancerId'],
      );
  bool get isSponsor => role.toLowerCase() == 'sponsor';
}

class SendOtpResult {
  final bool ok; final bool testMode; final String? testCode; final String? error;
  const SendOtpResult(this.ok, {this.testMode = false, this.testCode, this.error});
}

/// Phone + OTP auth (NO Supabase Auth). Fast2SMS from the client (DEV — key via
/// --dart-define=FAST2SMS_KEY). No key → test OTP 123456. Supabase Auth stays
/// for admin only.
class AuthPhone {
  static const _key = 'vallavan_session';
  static const _testOtp = '123456';
  static PhoneSession? _cached;

  static bool get fast2smsConfigured => Env.fast2smsConfigured;

  // --- session ---
  static Future<PhoneSession?> currentSession() async {
    if (_cached != null) return _cached;
    final sp = await SharedPreferences.getInstance();
    final raw = sp.getString(_key);
    if (raw == null) return null;
    try { _cached = PhoneSession.fromJson(jsonDecode(raw) as Map<String, dynamic>); return _cached; }
    catch (_) { return null; }
  }

  static PhoneSession? get cachedSession => _cached;

  static Future<void> _save(PhoneSession s) async {
    _cached = s;
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_key, jsonEncode(s.toJson()));
  }

  static Future<void> logout() async {
    _cached = null;
    final sp = await SharedPreferences.getInstance();
    await sp.remove(_key);
  }

  // --- helpers ---
  static String _norm(String p) { final d = p.replaceAll(RegExp(r'\D'), ''); return d.length > 10 ? d.substring(d.length - 10) : d; }
  static String _hash(String s) => sha256.convert(utf8.encode(s)).toString();
  static String _uuid() {
    final r = Random.secure();
    String h(int n) => List.generate(n, (_) => r.nextInt(16).toRadixString(16)).join();
    return '${h(8)}-${h(4)}-4${h(3)}-${(8 + r.nextInt(4)).toRadixString(16)}${h(3)}-${h(12)}';
  }

  // --- OTP ---
  static Future<SendOtpResult> sendOtp(String phone, {String purpose = 'register'}) async {
    final c = Db.client;
    if (c == null) return const SendOtpResult(false, error: 'Service not configured.');
    final numbers = _norm(phone);
    if (numbers.length < 10) return const SendOtpResult(false, error: 'Please enter a valid 10-digit mobile number.');

    final testMode = !Env.fast2smsConfigured;
    final code = testMode ? _testOtp : (100000 + Random.secure().nextInt(900000)).toString();
    try {
      await c.from('otp_verifications').insert({
        'phone': numbers, 'code_hash': _hash(code), 'purpose': purpose,
        'expires_at': DateTime.now().add(const Duration(minutes: 5)).toIso8601String(), 'consumed': false,
      });
    } catch (e) {
      return SendOtpResult(false, testMode: testMode, error: e.toString());
    }

    if (!testMode) {
      try {
        await http.post(Uri.parse('https://www.fast2sms.com/dev/bulkV2'),
          headers: {'authorization': Env.fast2smsKey, 'Content-Type': 'application/json'},
          body: jsonEncode({'route': 'otp', 'variables_values': code, 'numbers': numbers}));
      } catch (_) { /* OTP stored regardless */ }
      return const SendOtpResult(true);
    }
    return SendOtpResult(true, testMode: true, testCode: code);
  }

  static Future<bool> verifyOtp(String phone, String code) async {
    final c = Db.client;
    if (c == null) return false;
    final numbers = _norm(phone);
    try {
      final data = await c.from('otp_verifications').select('id, code_hash, expires_at, consumed')
          .eq('phone', numbers).order('created_at', ascending: false).limit(1).maybeSingle();
      if (data == null || data['consumed'] == true) return false;
      if (DateTime.parse(data['expires_at']).isBefore(DateTime.now())) return false;
      if (data['code_hash'] != _hash(code.trim())) return false;
      await c.from('otp_verifications').update({'consumed': true}).eq('id', data['id']);
      return true;
    } catch (_) {
      return false;
    }
  }

  // --- account creation ---
  static Future<PhoneSession> createSponsor({required String name, required String phone, required String email, required String district}) async {
    final c = Db.client;
    if (c == null) throw Exception('Service not configured.');
    final userId = _uuid(); final sponsorId = _uuid(); final p = _norm(phone);
    await c.from('app_users').insert({'id': userId, 'email': email, 'name': name, 'phone': p, 'role': 'Sponsor', 'status': 'Active'});
    await c.from('sponsors').insert({'id': sponsorId, 'name': name, 'owner_name': name, 'email': email, 'phone': p, 'district': district, 'owner_id': userId, 'status': 'Pending'});
    final s = PhoneSession(userId: userId, name: name, phone: p, email: email, role: 'Sponsor', sponsorId: sponsorId);
    await _save(s); _welcome(email, name);
    return s;
  }

  static Future<PhoneSession> createFreelancer({required String name, required String phone, required String email, required String district, List<String> roles = const []}) async {
    final c = Db.client;
    if (c == null) throw Exception('Service not configured.');
    final userId = _uuid(); final freelancerId = _uuid(); final p = _norm(phone);
    await c.from('app_users').insert({'id': userId, 'email': email, 'name': name, 'phone': p, 'role': 'Freelancer', 'status': 'Active'});
    await c.from('freelancers').insert({'id': freelancerId, 'user_id': userId, 'name': name, 'email': email, 'phone': p, 'district': district, 'roles': roles, 'status': 'pending'});
    final s = PhoneSession(userId: userId, name: name, phone: p, email: email, role: 'Freelancer', freelancerId: freelancerId);
    await _save(s); _welcome(email, name);
    return s;
  }

  /// Returning-user login after OTP verify.
  static Future<PhoneSession?> loginLookup(String phone) async {
    final c = Db.client;
    if (c == null) return null;
    final numbers = _norm(phone);
    try {
      final data = await c.rpc('find_user_by_phone', params: {'p': numbers});
      final list = (data as List?) ?? [];
      if (list.isEmpty) return null;
      final row = list.first as Map<String, dynamic>;
      final s = PhoneSession(
        userId: row['id'].toString(), name: row['name'] ?? '', phone: row['phone'] ?? numbers, email: row['email'] ?? '',
        role: (row['role'].toString().toLowerCase() == 'sponsor') ? 'Sponsor' : 'Freelancer',
        sponsorId: row['sponsor_id']?.toString(), freelancerId: row['freelancer_id']?.toString(),
      );
      await _save(s);
      return s;
    } catch (_) {
      return null;
    }
  }

  static Future<void> _welcome(String email, String name) async {
    if (!Env.hasBackend && Env.resendKey.isEmpty) return;
    try {
      if (Env.hasBackend) {
        await http.post(Uri.parse('${Env.apiBaseUrl}/api/notify/welcome'), headers: {'Content-Type': 'application/json'}, body: jsonEncode({'email': email, 'name': name}));
      } else {
        await http.post(Uri.parse('https://api.resend.com/emails'),
          headers: {'Authorization': 'Bearer ${Env.resendKey}', 'Content-Type': 'application/json'},
          body: jsonEncode({'from': 'Vallavan <noreply@vallavan.in>', 'to': email, 'subject': 'Welcome to Vallavan', 'html': '<p>Vanakkam $name,</p><p>Welcome to Vallavan.</p>'}));
      }
    } catch (_) { /* ignore */ }
  }
}
