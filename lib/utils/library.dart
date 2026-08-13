import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/documentary.dart';

/// Local Watch History + Watch Later (SharedPreferences), mirroring the web app.
class Library {
  static const _hist = 'watch_history';
  static const _later = 'watch_later';

  static Future<List<Documentary>> _read(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(key) ?? [];
    return raw.map((s) {
      try {
        return Documentary.fromJson(jsonDecode(s) as Map<String, dynamic>);
      } catch (_) {
        return null;
      }
    }).whereType<Documentary>().toList();
  }

  static Future<void> _write(String key, List<Documentary> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(key, items.map((d) => jsonEncode(d.toJson())).toList());
  }

  static Future<List<Documentary>> history() => _read(_hist);

  static Future<void> addToHistory(Documentary d) async {
    if (d.id == 'live-player') return;
    final list = (await _read(_hist)).where((x) => x.id != d.id).toList();
    list.insert(0, d);
    await _write(_hist, list.take(50).toList());
  }

  static Future<void> clearHistory() => _write(_hist, []);

  static Future<List<Documentary>> watchLater() => _read(_later);

  static Future<bool> isWatchLater(String id) async =>
      (await _read(_later)).any((x) => x.id == id);

  /// Toggle; returns the new saved state (true = now saved).
  static Future<bool> toggleWatchLater(Documentary d) async {
    final list = await _read(_later);
    final exists = list.any((x) => x.id == d.id);
    if (exists) {
      await _write(_later, list.where((x) => x.id != d.id).toList());
      return false;
    }
    await _write(_later, [d, ...list]);
    return true;
  }
}
