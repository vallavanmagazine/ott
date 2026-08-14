import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/auth_phone_service.dart';
import '../register_screen.dart';
import 'sponsor_dashboard_screen.dart';
import '../freelancer/freelancer_dashboard_screen.dart';

/// Returning-user login via phone + OTP (NO Supabase Auth). Looks up the
/// account by phone and routes to the matching dashboard.
class SponsorLoginScreen extends StatefulWidget {
  const SponsorLoginScreen({super.key});
  @override
  State<SponsorLoginScreen> createState() => _SponsorLoginScreenState();
}

enum _Step { phone, otp }

class _SponsorLoginScreenState extends State<SponsorLoginScreen> {
  final _phone = TextEditingController();
  final _code = TextEditingController();
  _Step _step = _Step.phone;
  bool _loading = false;
  String? _error;

  @override
  void dispose() { _phone.dispose(); _code.dispose(); super.dispose(); }

  Future<void> _send() async {
    setState(() => _error = null);
    if (_phone.text.replaceAll(RegExp(r'\D'), '').length < 10) { setState(() => _error = 'Enter a valid 10-digit mobile number.'); return; }
    setState(() => _loading = true);
    final res = await AuthPhone.sendOtp(_phone.text.trim(), purpose: 'login');
    if (!mounted) return;
    setState(() => _loading = false);
    if (!res.ok) { setState(() => _error = res.error ?? 'Could not send OTP.'); return; }
    if (res.testMode && res.testCode != null) _code.text = res.testCode!;
    setState(() => _step = _Step.otp);
  }

  Future<void> _login() async {
    setState(() { _error = null; _loading = true; });
    final ok = await AuthPhone.verifyOtp(_phone.text.trim(), _code.text.trim());
    if (!mounted) return;
    if (!ok) { setState(() { _loading = false; _error = 'Incorrect or expired OTP.'; }); return; }
    final session = await AuthPhone.loginLookup(_phone.text.trim());
    if (!mounted) return;
    setState(() => _loading = false);
    if (session == null) { setState(() => _error = 'No account found for this number. Please register first.'); return; }
    Navigator.pushReplacement(context, MaterialPageRoute(
      builder: (_) => session.isSponsor ? const SponsorDashboardScreen() : const FreelancerDashboardScreen(),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Login', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        const SizedBox(height: 12),
        const Text('Sponsors & freelancers — sign in with your mobile.', style: TextStyle(color: AppColors.muted)),
        const SizedBox(height: 20),
        if (_step == _Step.phone) ...[
          _field(_phone, 'Mobile number', Icons.smartphone, keyboard: TextInputType.phone),
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _loading ? null : _send,
            style: FilledButton.styleFrom(backgroundColor: AppColors.gold, foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
            child: Text(_loading ? 'Sending…' : 'Send OTP'),
          ),
        ] else ...[
          TextField(
            controller: _code, keyboardType: TextInputType.number, textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 20, letterSpacing: 8),
            decoration: InputDecoration(hintText: '••••••', hintStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
          ),
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _loading ? null : _login,
            style: FilledButton.styleFrom(backgroundColor: AppColors.gold, foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
            child: Text(_loading ? 'Signing in…' : 'Login'),
          ),
          TextButton(onPressed: () => setState(() { _step = _Step.phone; _error = null; }), child: const Text('Change number', style: TextStyle(color: AppColors.muted))),
        ],
        const SizedBox(height: 24),
        const Divider(color: Colors.white12),
        const SizedBox(height: 8),
        const Center(child: Text("Don't have an account?", style: TextStyle(fontSize: 12, color: AppColors.muted))),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          TextButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen(role: 'sponsor'))), child: const Text('Register as Sponsor', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold))),
          const Text('|', style: TextStyle(color: AppColors.muted)),
          TextButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen(role: 'freelancer'))), child: const Text('Register as Freelancer', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold))),
        ]),
      ]),
    );
  }

  Widget _field(TextEditingController c, String hint, IconData icon, {TextInputType? keyboard}) => TextField(
        controller: c, keyboardType: keyboard, style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(hintText: hint, hintStyle: const TextStyle(color: AppColors.muted), prefixIcon: Icon(icon, color: AppColors.muted, size: 18), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
      );
}
