import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';

/// Viewer district detection for geo-targeted ads.
/// Order: cached preference → GPS (nearest TN district) → 'Chennai'.
class GeoDetect {
  static const _key = 'district';
  static const _default = 'Chennai';

  // Approx coordinates of a handful of TN districts for nearest-match.
  static const _coords = <String, List<double>>{
    'Chennai': [13.08, 80.27],
    'Coimbatore': [11.02, 76.96],
    'Madurai': [9.93, 78.12],
    'Tiruchirappalli': [10.79, 78.70],
    'Salem': [11.66, 78.15],
    'Tirunelveli': [8.71, 77.76],
    'Nilgiris': [11.41, 76.70],
    'Thanjavur': [10.79, 79.14],
    'Vellore': [12.92, 79.13],
    'Thoothukudi': [8.76, 78.13],
  };

  static Future<void> setDistrict(String d) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, d);
  }

  static Future<String?> cached() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key);
  }

  static double _dist(double aLat, double aLon, double bLat, double bLon) {
    final dLat = aLat - bLat;
    final dLon = aLon - bLon;
    return dLat * dLat + dLon * dLon;
  }

  static String _nearest(double lat, double lon) {
    var best = _default;
    var bestD = double.infinity;
    _coords.forEach((name, c) {
      final d = _dist(lat, lon, c[0], c[1]);
      if (d < bestD) {
        bestD = d;
        best = name;
      }
    });
    return best;
  }

  static Future<String> detectDistrict() async {
    final c = await cached();
    if (c != null && K.tamilNaduDistricts.contains(c)) return c;
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        return _default;
      }
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
      ).timeout(const Duration(seconds: 6));
      final district = _nearest(pos.latitude, pos.longitude);
      await setDistrict(district);
      return district;
    } catch (_) {
      return _default;
    }
  }
}
