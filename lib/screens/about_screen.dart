import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../widgets/vallavan_logo.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('About Vallavan', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(24), children: [
        const SizedBox(height: 12),
        const Center(child: VallavanLogo(size: 72)),
        const SizedBox(height: 16),
        const Center(child: Text('VALLAVAN', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 3, color: Colors.white))),
        const Center(child: Text('DOCUMENTARIES THAT MATTER', style: TextStyle(fontSize: 9, letterSpacing: 2, color: AppColors.muted))),
        const SizedBox(height: 8),
        const Center(child: Text('Version 1.0.0', style: TextStyle(fontSize: 12, color: AppColors.muted))),
        const SizedBox(height: 28),
        Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(14)), child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Icon(Icons.favorite, color: AppColors.red, size: 16), SizedBox(width: 8), Text('Our Mission', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white))]),
          SizedBox(height: 8),
          Text('Vallavan is a Tamil-first documentary platform — telling the stories of our land, people, and ideas that matter. Free for everyone, supported by sponsors.', style: TextStyle(fontSize: 13, height: 1.5, color: Colors.white70)),
        ])),
        const SizedBox(height: 16),
        const Center(child: Text('© 2026 Vallavan. Made in Tamil Nadu.', style: TextStyle(fontSize: 11, color: AppColors.muted))),
      ]),
    );
  }
}
