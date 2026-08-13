import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Help & Support', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
          child: const Row(children: [Icon(Icons.support_agent, color: AppColors.red), SizedBox(width: 12), Expanded(child: Text("We're here to help. Typical reply within 24 hours.", style: TextStyle(color: Colors.white)))])),
        const SizedBox(height: 16),
        _tile(Icons.email_outlined, 'Email', 'support@vallavan.in', () => launchUrl(Uri.parse('mailto:support@vallavan.in'))),
        _tile(Icons.phone_outlined, 'Phone', '+91 44 0000 0000', () => launchUrl(Uri.parse('tel:+914400000000'))),
        _tile(Icons.chat_outlined, 'WhatsApp', 'Chat with support', () => launchUrl(Uri.parse('https://wa.me/919000000000'))),
        const SizedBox(height: 20),
        const Text('FAQ', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        _faq('Is Vallavan free?', 'Yes — all documentaries are free to watch, supported by sponsors.'),
        _faq('Do I need an account?', 'No. Viewing needs no login. Watch History & Later are saved on your device.'),
        _faq('How do I advertise?', 'Profile → Become a Sponsor to create geo-targeted campaigns.'),
      ]),
    );
  }

  Widget _tile(IconData i, String t, String s, VoidCallback onTap) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
        child: ListTile(leading: Icon(i, color: AppColors.gold), title: Text(t, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)), subtitle: Text(s, style: const TextStyle(color: AppColors.muted, fontSize: 12)), onTap: onTap),
      );

  Widget _faq(String q, String a) => Container(
        margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(q, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)), const SizedBox(height: 4), Text(a, style: const TextStyle(color: AppColors.muted, fontSize: 12, height: 1.4))]),
      );
}
