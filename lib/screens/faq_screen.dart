import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';

/// Help & Support — a simple FAQ page (FIX 2). The AI assistant lives inside the
/// Sponsor/Freelancer dashboards, not here. Support = FAQ + email only.
class FaqScreen extends StatelessWidget {
  const FaqScreen({super.key});

  static const _faqs = [
    ['Is Vallavan free?', 'Yes — all documentaries are free to watch, supported by sponsors (AVOD).'],
    ['Do I need an account?', 'No. Viewing needs no login. Watch History & Later are saved on your device.'],
    ['How do I advertise?', 'Profile → Become a Sponsor to see pricing and register. Manage campaigns from the Sponsor Dashboard.'],
    ['How do I freelance?', 'Profile → Join as Freelancer, register, and complete your application. The AI assistant inside the Freelancer Dashboard helps with tasks and payments.'],
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Help & Support', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
          child: const Row(children: [
            Icon(Icons.support_agent, color: AppColors.red),
            SizedBox(width: 12),
            Expanded(child: Text('Browse common questions, or email us. Sponsor & freelancer support live inside their dashboards (AI assistant).', style: TextStyle(color: Colors.white, fontSize: 13))),
          ]),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: const Icon(Icons.email_outlined, color: AppColors.gold),
            title: const Text('Email', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            subtitle: const Text('support@vallavan.in', style: TextStyle(color: AppColors.muted, fontSize: 12)),
            onTap: () => launchUrl(Uri.parse('mailto:support@vallavan.in')),
          ),
        ),
        const SizedBox(height: 20),
        const Text('FAQ', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        ..._faqs.map((f) => Container(
              margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(f[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(f[1], style: const TextStyle(color: AppColors.muted, fontSize: 12, height: 1.4)),
              ]),
            )),
      ]),
    );
  }
}
