import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/auth_service.dart';
import 'sponsor_dashboard_screen.dart';

class SponsorLoginScreen extends StatefulWidget {
  const SponsorLoginScreen({super.key});
  @override
  State<SponsorLoginScreen> createState() => _SponsorLoginScreenState();
}

class _SponsorLoginScreenState extends State<SponsorLoginScreen> {
  final _email = TextEditingController();
  final _pass = TextEditingController();
  String? _error;
  bool _loading = false;

  @override
  void dispose() { _email.dispose(); _pass.dispose(); super.dispose(); }

  Future<void> _login() async {
    setState(() { _error = null; _loading = true; });
    final res = await AuthService.login(_email.text.trim(), _pass.text);
    if (!mounted) return;
    setState(() => _loading = false);
    if (!res.ok) { setState(() => _error = res.error ?? 'Login failed'); return; }
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const SponsorDashboardScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Sponsor Login', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        const SizedBox(height: 20),
        const Text('For advertisers & business accounts', style: TextStyle(color: AppColors.muted)),
        const SizedBox(height: 20),
        _field(_email, 'Work Email', Icons.mail_outline),
        const SizedBox(height: 12),
        _field(_pass, 'Password', Icons.lock_outline, obscure: true),
        if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: _loading ? null : _login,
          style: FilledButton.styleFrom(backgroundColor: AppColors.gold, foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
          child: Text(_loading ? 'Signing in…' : 'Sign In'),
        ),
        const SizedBox(height: 12),
        const Center(child: Text('Viewing Vallavan is always free. Login is only for sponsor tools.', textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: AppColors.muted))),
      ]),
    );
  }

  Widget _field(TextEditingController c, String hint, IconData icon, {bool obscure = false}) => TextField(
        controller: c, obscureText: obscure, style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(hintText: hint, hintStyle: const TextStyle(color: AppColors.muted), prefixIcon: Icon(icon, color: AppColors.muted, size: 18), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
      );
}
