import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/env.dart';

/// Thin client for the NestJS backend (payment links, OTP). Mirrors the web
/// `lib/api.ts`. Throws a clear error when the backend is not configured.
class Api {
  static bool get hasBackend => Env.hasBackend;

  static Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    if (!Env.hasBackend) {
      throw Exception('Backend not configured (set API_BASE_URL via --dart-define).');
    }
    final url = Uri.parse('${Env.apiBaseUrl}$path');
    final res = await http.post(url, headers: {'Content-Type': 'application/json'}, body: jsonEncode(body));
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('API $path failed: ${res.statusCode}');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}
