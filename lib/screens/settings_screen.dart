import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../services/preferences_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _lang = 'en';
  bool _notif = true;
  String _district = 'Chennai';

  @override
  void initState() {
    super.initState();
    Prefs.language().then((v) { if (mounted) setState(() => _lang = v); });
    Prefs.notifications().then((v) { if (mounted) setState(() => _notif = v); });
    Prefs.district().then((v) { if (mounted) setState(() => _district = v); });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('App Settings', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('LANGUAGE', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Row(children: [
          _langBtn('English', 'en'),
          const SizedBox(width: 8),
          _langBtn('தமிழ்', 'ta'),
        ]),
        const SizedBox(height: 20),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          activeColor: AppColors.red,
          title: const Text('Notifications', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          subtitle: const Text('Push & in-app alerts', style: TextStyle(color: AppColors.muted, fontSize: 12)),
          value: _notif,
          onChanged: (v) { setState(() => _notif = v); Prefs.setNotifications(v); },
        ),
        const SizedBox(height: 12),
        const Text('YOUR DISTRICT', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
        const Text('Used for locally relevant ads.', style: TextStyle(fontSize: 11, color: AppColors.muted)),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: K.tamilNaduDistricts.map((d) {
          final sel = d == _district;
          return GestureDetector(
            onTap: () { setState(() => _district = d); Prefs.setDistrict(d); },
            child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7), decoration: BoxDecoration(color: sel ? AppColors.red : AppColors.glass, borderRadius: BorderRadius.circular(999)), child: Text(d, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: sel ? Colors.white : AppColors.muted))),
          );
        }).toList()),
        const SizedBox(height: 24),
      ]),
    );
  }

  Widget _langBtn(String label, String code) {
    final sel = _lang == code;
    return Expanded(child: GestureDetector(
      onTap: () { setState(() => _lang = code); Prefs.setLanguage(code); },
      child: Container(padding: const EdgeInsets.symmetric(vertical: 14), alignment: Alignment.center, decoration: BoxDecoration(color: sel ? AppColors.red : AppColors.glass, borderRadius: BorderRadius.circular(12)), child: Text(label, style: TextStyle(fontWeight: FontWeight.bold, color: sel ? Colors.white : AppColors.muted))),
    ));
  }
}
