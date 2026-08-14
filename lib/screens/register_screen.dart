import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../config/constants.dart';
import '../services/auth_phone_service.dart';
import '../services/freelancer_service.dart';
import 'sponsor/sponsor_dashboard_screen.dart';
import 'freelancer/freelancer_dashboard_screen.dart';

/// Phone-OTP registration (NO Supabase Auth). Sponsor + freelancer.
class RegisterScreen extends StatefulWidget {
  final String role; // 'sponsor' | 'freelancer'
  const RegisterScreen({super.key, required this.role});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

enum _Step { form, otp }

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _code = TextEditingController();
  String _district = 'Chennai';
  final Set<String> _roles = {};
  _Step _step = _Step.form;
  bool _busy = false;
  String? _error;

  bool get _isSponsor => widget.role == 'sponsor';
  String get _title => _isSponsor ? 'Register as Sponsor' : 'Register as Freelancer';

  @override
  void dispose() { _name.dispose(); _phone.dispose(); _email.dispose(); _code.dispose(); super.dispose(); }

  bool _validEmail(String e) => RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(e.trim());

  Future<void> _send() async {
    setState(() => _error = null);
    if (_name.text.trim().isEmpty) { setState(() => _error = 'Please enter your name.'); return; }
    if (_phone.text.replaceAll(RegExp(r'\D'), '').length < 10) { setState(() => _error = 'Please enter a valid 10-digit mobile number.'); return; }
    if (!_validEmail(_email.text)) { setState(() => _error = 'Please enter a valid email address.'); return; }
    if (!_isSponsor && _roles.isEmpty) { setState(() => _error = 'Please pick at least one role.'); return; }
    setState(() => _busy = true);
    final res = await AuthPhone.sendOtp(_phone.text.trim());
    if (!mounted) return;
    setState(() => _busy = false);
    if (!res.ok) { setState(() => _error = res.error ?? 'Could not send OTP.'); return; }
    if (res.testMode && res.testCode != null) {
      _code.text = res.testCode!;
      if (mounted) {
        showDialog(context: context, builder: (_) => AlertDialog(
          backgroundColor: AppColors.dark,
          title: const Text('SMS not configured', style: TextStyle(color: Colors.white)),
          content: Text('Using test OTP: ${res.testCode}', style: const TextStyle(color: AppColors.muted)),
          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
        ));
      }
    }
    setState(() => _step = _Step.otp);
  }

  Future<void> _verify() async {
    setState(() { _error = null; _busy = true; });
    final ok = await AuthPhone.verifyOtp(_phone.text.trim(), _code.text.trim());
    if (!mounted) return;
    if (!ok) { setState(() { _busy = false; _error = 'That OTP is incorrect or expired.'; }); return; }
    try {
      if (_isSponsor) {
        await AuthPhone.createSponsor(name: _name.text.trim(), phone: _phone.text.trim(), email: _email.text.trim(), district: _district);
      } else {
        await AuthPhone.createFreelancer(name: _name.text.trim(), phone: _phone.text.trim(), email: _email.text.trim(), district: _district, roles: _roles.toList());
      }
    } catch (e) {
      if (mounted) setState(() { _busy = false; _error = e.toString().replaceFirst('Exception: ', ''); });
      return;
    }
    if (!mounted) return;
    Navigator.pushReplacement(context, MaterialPageRoute(
      builder: (_) => _isSponsor ? const SponsorDashboardScreen() : const FreelancerDashboardScreen(),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: Text(_title, style: const TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(16), children: _step == _Step.form ? _form() : _otp()),
    );
  }

  List<Widget> _form() => [
        Text(_isSponsor ? 'Create your sponsor account' : 'Create your freelancer account', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        const Text('Verify your mobile with a one-time code.', style: TextStyle(color: AppColors.muted, fontSize: 12)),
        const SizedBox(height: 16),
        _field(_name, _isSponsor ? 'Key Person Name *' : 'Full Name *'),
        _field(_phone, 'Mobile *', keyboard: TextInputType.phone),
        _field(_email, _isSponsor ? 'Official / Company Email *' : 'Email *', keyboard: TextInputType.emailAddress),
        _dropdown('District', _district, K.tamilNaduDistricts, (v) => setState(() => _district = v)),
        if (!_isSponsor) ...[
          const Padding(padding: EdgeInsets.only(top: 4, bottom: 8), child: Text('Roles applying for *', style: TextStyle(color: AppColors.muted, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1))),
          Wrap(spacing: 8, runSpacing: 8, children: FreelancerService.roles.map((r) {
            final on = _roles.contains(r);
            return GestureDetector(
              onTap: () => setState(() => on ? _roles.remove(r) : _roles.add(r)),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(color: on ? AppColors.red : AppColors.glass, borderRadius: BorderRadius.circular(999)),
                child: Text(r, style: TextStyle(color: on ? Colors.white : AppColors.muted, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            );
          }).toList()),
          const SizedBox(height: 6),
        ],
        if (_error != null) Padding(padding: const EdgeInsets.only(top: 8, bottom: 8), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
        FilledButton(
          onPressed: _busy ? null : _send,
          style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
          child: Text(_busy ? 'Sending OTP…' : 'Send OTP', style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
      ];

  List<Widget> _otp() => [
        const Text('Enter the OTP', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text('Sent to +91 ${_phone.text.replaceAll(RegExp(r'\D'), '')}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        const SizedBox(height: 16),
        TextField(
          controller: _code, keyboardType: TextInputType.number, textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.white, fontSize: 20, letterSpacing: 8),
          decoration: InputDecoration(hintText: '••••••', hintStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
        ),
        if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : _verify,
          style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
          child: Text(_busy ? 'Verifying…' : 'Verify & Register', style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
        TextButton(onPressed: () => setState(() { _step = _Step.form; _error = null; }), child: const Text('Edit details', style: TextStyle(color: AppColors.muted))),
      ];

  Widget _field(TextEditingController c, String hint, {TextInputType? keyboard}) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(controller: c, keyboardType: keyboard, style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(hintText: hint, hintStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none))),
      );

  Widget _dropdown(String label, String value, List<String> items, ValueChanged<String> onChanged) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: InputDecorator(
          decoration: InputDecoration(labelText: label, labelStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4)),
          child: DropdownButtonHideUnderline(child: DropdownButton<String>(
            value: value, isExpanded: true, dropdownColor: AppColors.glassStrong, style: const TextStyle(color: Colors.white, fontSize: 14),
            items: items.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
            onChanged: (v) { if (v != null) onChanged(v); },
          )),
        ),
      );
}
