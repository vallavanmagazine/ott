import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/env.dart';
import '../utils/identity.dart' as identity;
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

/// Phone + email OTP auth (NO Supabase Auth). ALL OTP operations route through
/// the NestJS backend (`Env.apiBaseUrl` + `/api/otp/*`), which uses the
/// service-role key server-side. The client never writes otp_verifications
/// directly — RLS correctly blocks the anon key from that table. Supabase Auth
/// stays for admin login only.
class AuthPhone {
  static const _key = 'vallavan_session';
  static PhoneSession? _cached;

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
  static String _norm(String p) => identity.normPhone(p);
  static String _uuid() {
    final r = Random.secure();
    String h(int n) => List.generate(n, (_) => r.nextInt(16).toRadixString(16)).join();
    return '${h(8)}-${h(4)}-4${h(3)}-${(8 + r.nextInt(4)).toRadixString(16)}${h(3)}-${h(12)}';
  }

  // --- OTP (backend-only; never writes otp_verifications with the anon key) ---
  static Future<SendOtpResult> sendOtp(String phone, {String purpose = 'register'}) async {
    final numbers = _norm(phone);
    if (numbers.length < 10) return const SendOtpResult(false, error: 'Please enter a valid 10-digit mobile number.');
    try {
      final res = await http.post(Uri.parse('${Env.apiBaseUrl}/api/otp/send'),
        headers: {'Content-Type': 'application/json'}, body: jsonEncode({'phone': numbers}));
      if (res.statusCode < 200 || res.statusCode >= 300) return SendOtpResult(false, error: 'OTP service error (${res.statusCode}).');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['channel'] == 'skipped') return const SendOtpResult(false, error: 'SMS not configured on the server. Add FAST2SMS_API_KEY in Admin → API Settings.');
      return const SendOtpResult(true);
    } catch (e) {
      return SendOtpResult(false, error: 'Could not reach the OTP service. $e');
    }
  }

  static Future<bool> verifyOtp(String phone, String code) async {
    final numbers = _norm(phone);
    try {
      final res = await http.post(Uri.parse('${Env.apiBaseUrl}/api/otp/verify'),
        headers: {'Content-Type': 'application/json'}, body: jsonEncode({'phone': numbers, 'code': code.trim()}));
      if (res.statusCode < 200 || res.statusCode >= 300) return false;
      return (jsonDecode(res.body) as Map<String, dynamic>)['ok'] == true;
    } catch (_) {
      return false;
    }
  }

  // --- EMAIL OTP (backend-only, via Resend) ---
  static Future<SendOtpResult> sendEmailOtp(String email, {String purpose = 'email_verify'}) async {
    final e = email.trim().toLowerCase();
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(e)) {
      return const SendOtpResult(false, error: 'Please enter a valid email address.');
    }
    try {
      final res = await http.post(Uri.parse('${Env.apiBaseUrl}/api/otp/send-email'),
        headers: {'Content-Type': 'application/json'}, body: jsonEncode({'email': e}));
      if (res.statusCode < 200 || res.statusCode >= 300) return SendOtpResult(false, error: 'Email OTP error (${res.statusCode}).');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['channel'] == 'skipped') return const SendOtpResult(false, error: 'Email not configured on the server. Add RESEND_API_KEY in Admin → API Settings.');
      return const SendOtpResult(true);
    } catch (err) {
      return SendOtpResult(false, error: 'Could not reach the email OTP service. $err');
    }
  }

  static Future<bool> verifyEmailOtp(String email, String code) async {
    final e = email.trim().toLowerCase();
    try {
      final res = await http.post(Uri.parse('${Env.apiBaseUrl}/api/otp/verify-email'),
        headers: {'Content-Type': 'application/json'}, body: jsonEncode({'email': e, 'code': code.trim()}));
      if (res.statusCode < 200 || res.statusCode >= 300) return false;
      return (jsonDecode(res.body) as Map<String, dynamic>)['ok'] == true;
    } catch (_) {
      return false;
    }
  }

  // --- account creation ---
  static Future<PhoneSession> createSponsor({required String name, required String phone, required String email, required String district}) async {
    final c = Db.client;
    if (c == null) throw Exception('Service not configured.');
    final userId = _uuid(); final sponsorId = _uuid(); final p = _norm(phone); final em = identity.normEmail(email);
    await c.from('app_users').insert({'id': userId, 'email': em, 'name': name, 'phone': p, 'role': 'Sponsor', 'status': 'Active'});
    await c.from('sponsors').insert({'id': sponsorId, 'name': name, 'owner_name': name, 'email': em, 'phone': p, 'district': district, 'owner_id': userId, 'status': 'Pending'});
    final s = PhoneSession(userId: userId, name: name, phone: p, email: em, role: 'Sponsor', sponsorId: sponsorId);
    await _save(s); _welcome(em, name, 'sponsor');
    return s;
  }

  static Future<PhoneSession> createFreelancer({required String name, required String phone, required String email, required String district, List<String> roles = const []}) async {
    final c = Db.client;
    if (c == null) throw Exception('Service not configured.');
    final userId = _uuid(); final freelancerId = _uuid(); final p = _norm(phone); final em = identity.normEmail(email);
    await c.from('app_users').insert({'id': userId, 'email': em, 'name': name, 'phone': p, 'role': 'Freelancer', 'status': 'Active'});
    await c.from('freelancers').insert({'id': freelancerId, 'user_id': userId, 'name': name, 'email': em, 'phone': p, 'district': district, 'roles': roles, 'status': 'pending'});
    final s = PhoneSession(userId: userId, name: name, phone: p, email: em, role: 'Freelancer', freelancerId: freelancerId);
    await _save(s); _welcome(em, name, 'freelancer');
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
    } catch (e) {
      // Distinguish a real RPC failure (missing function, RLS, bad grant) from a
      // genuine "no account" — a broken lookup was previously silent.
      debugPrint('[loginLookup] find_user_by_phone RPC failed: $e');
      return null;
    }
  }

  /// Best-effort welcome email via the backend (Resend server-side). Never throws.
  static Future<void> _welcome(String email, String name, [String role = 'member']) async {
    try {
      await http.post(Uri.parse('${Env.apiBaseUrl}/api/notify/welcome'),
        headers: {'Content-Type': 'application/json'}, body: jsonEncode({'email': email, 'name': name, 'role': role}));
    } catch (_) { /* ignore */ }
  }
}
