import 'dart:convert';
import 'package:http/http.dart' as http;
import 'supabase_client.dart';

/// The single-row `broadcast_config` control table that drives the Live TV
/// overlay. Mirrors the web `services/broadcast.ts`.
class BroadcastConfig {
  final bool channelLive;
  final bool tickerEnabled;
  final bool weatherEnabled;
  final String weatherCity;
  final bool breakingActive;
  final String breakingHeadline;
  final String breakingBody;

  const BroadcastConfig({
    this.channelLive = false,
    this.tickerEnabled = true,
    this.weatherEnabled = true,
    this.weatherCity = 'Chennai',
    this.breakingActive = false,
    this.breakingHeadline = '',
    this.breakingBody = '',
  });

  static const defaults = BroadcastConfig();

  factory BroadcastConfig.fromMap(Map<String, dynamic> r) => BroadcastConfig(
        channelLive: r['channel_live'] == true,
        tickerEnabled: r['ticker_enabled'] != false,
        weatherEnabled: r['weather_enabled'] != false,
        weatherCity: (r['weather_city'] ?? 'Chennai').toString(),
        breakingActive: r['breaking_active'] == true,
        breakingHeadline: (r['breaking_headline'] ?? '').toString(),
        breakingBody: (r['breaking_body'] ?? '').toString(),
      );
}

class Weather {
  final int tempC;
  final String label;
  final String day;
  const Weather(this.tempC, this.label, this.day);
}

class TickerItem {
  final String id;
  final String text;
  final String? textTa;
  const TickerItem(this.id, this.text, this.textTa);
}

class BroadcastService {
  static const _weekdays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];

  static const _cityCoords = <String, List<double>>{
    'Chennai': [13.08, 80.27],
    'Coimbatore': [11.02, 76.96],
    'Madurai': [9.93, 78.12],
    'Tiruchirappalli': [10.79, 78.70],
    'Salem': [11.66, 78.15],
    'Tirunelveli': [8.71, 77.76],
    'Nilgiris': [11.41, 76.70],
    'Thanjavur': [10.79, 79.14],
  };

  static Future<BroadcastConfig> fetchConfig() async {
    final c = Db.client;
    if (c == null) return BroadcastConfig.defaults;
    try {
      final r = await c.from('broadcast_config').select().eq('id', 1).maybeSingle();
      return r == null ? BroadcastConfig.defaults : BroadcastConfig.fromMap(r);
    } catch (_) {
      return BroadcastConfig.defaults;
    }
  }

  static String _weatherLabel(int code) {
    if (code == 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Cloudy';
  }

  /// Open-Meteo — free and key-less, same source as the web overlay.
  static Future<Weather?> fetchWeather([String city = 'Chennai']) async {
    final coords = _cityCoords[city] ?? _cityCoords['Chennai']!;
    final day = _weekdays[DateTime.now().weekday - 1];
    try {
      final uri = Uri.parse(
        'https://api.open-meteo.com/v1/forecast'
        '?latitude=${coords[0]}&longitude=${coords[1]}'
        '&current=temperature_2m,weather_code',
      );
      final res = await http.get(uri).timeout(const Duration(seconds: 6));
      if (res.statusCode != 200) return null;
      final cur = (jsonDecode(res.body) as Map<String, dynamic>)['current'] as Map<String, dynamic>;
      final code = (cur['weather_code'] as num).toInt();
      return Weather((cur['temperature_2m'] as num).round(), _weatherLabel(code), day);
    } catch (_) {
      return null;
    }
  }

  static const _fallbackTicker = [
    TickerItem('f1', 'Welcome to VALLAVAN TV — Tamil documentaries, 24/7.', null),
  ];

  static Future<List<TickerItem>> fetchTicker() async {
    final c = Db.client;
    if (c == null) return _fallbackTicker;
    try {
      final data = await c
          .from('ticker_items')
          .select('id, text, text_ta')
          .order('priority', ascending: false)
          .limit(50);
      final rows = (data as List)
          .map((r) => TickerItem(r['id'].toString(), (r['text'] ?? '').toString(), r['text_ta']?.toString()))
          .where((t) => t.text.isNotEmpty)
          .toList();
      return rows.isEmpty ? _fallbackTicker : rows;
    } catch (_) {
      return _fallbackTicker;
    }
  }
}
