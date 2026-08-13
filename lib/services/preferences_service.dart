import 'package:shared_preferences/shared_preferences.dart';
import '../utils/geo_detect.dart';

/// Viewer preferences: language, notifications, district. Plus recent searches.
class Prefs {
  static const _lang = 'pref_language';
  static const _notif = 'pref_notifications';
  static const _recent = 'recent_searches';
  static const _notify = 'livetv_notify';

  static Future<String> language() async =>
      (await SharedPreferences.getInstance()).getString(_lang) ?? 'en';
  static Future<void> setLanguage(String v) async =>
      (await SharedPreferences.getInstance()).setString(_lang, v);

  static Future<bool> notifications() async =>
      (await SharedPreferences.getInstance()).getBool(_notif) ?? true;
  static Future<void> setNotifications(bool v) async =>
      (await SharedPreferences.getInstance()).setBool(_notif, v);

  static Future<String> district() async => (await GeoDetect.cached()) ?? 'Chennai';
  static Future<void> setDistrict(String v) => GeoDetect.setDistrict(v);

  static Future<List<String>> recentSearches() async =>
      (await SharedPreferences.getInstance()).getStringList(_recent) ?? [];

  static Future<void> addRecentSearch(String q) async {
    if (q.trim().isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    final list = (prefs.getStringList(_recent) ?? []).where((s) => s != q).toList();
    list.insert(0, q);
    await prefs.setStringList(_recent, list.take(8).toList());
  }

  static Future<void> setLiveNotify(String email) async =>
      (await SharedPreferences.getInstance()).setString(_notify, email);
  static Future<bool> hasLiveNotify() async =>
      (await SharedPreferences.getInstance()).getString(_notify) != null;
}
