import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../config/constants.dart';
import '../services/registration_service.dart';
import 'sponsor/sponsor_dashboard_screen.dart';
import 'freelancer/freelancer_dashboard_screen.dart';

/// Registration for sponsor + freelancer (no signup existed before). Mobile OTP
/// (Fast2SMS) verified first when available; account created via email OTP.
/// On success → the relevant dashboard.
class RegisterScreen extends StatefulWidget {
  final String role; // 'sponsor' | 'freelancer'
  const RegisterScreen({super.key, required this.role});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

enum _Step { form, mobileOtp, emailOtp }

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _code = TextEditingController();
  String _district = 'Chennai';
  _Step _step = _Step.form;
  bool _busy = false;
  String? _error;

  bool get _isSponsor => widget.role == 'sponsor';
  String get _title => _isSponsor ? 'Register as Sponsor' : 'Register as Freelancer';

  @override
  void dispose() {
    _name.dispose(); _phone.dispose(); _email.dispose(); _code.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    setState(() => _error = null);
    if (_name.text.trim().isEmpty || _phone.text.trim().length < 10 || _email.text.trim().isEmpty) {
      setState(() => _error = 'Name, a valid 10-digit mobile, and email are required.'); return;
    }
    setState(() => _busy = true);
    if (RegistrationService.phoneOtpAvailable) {
      final err = await RegistrationService.sendMobileOtp(_phone.text.trim());
      if (!mounted) return;
      setState(() { _busy = false; _error = err; if (err == null) { _step = _Step.mobileOtp; _code.clear(); } });
    } else {
      await _sendEmail();
    }
  }

  Future<void> _confirmMobile() async {
    setState(() { _error = null; _busy = true; });
    final ok = await RegistrationService.verifyMobileOtp(_phone.text.trim(), _code.text.trim());
    if (!mounted) return;
    if (!ok) { setState(() { _busy = false; _error = 'Incorrect mobile OTP.'; }); return; }
    await _sendEmail();
  }

  Future<void> _sendEmail() async {
    final err = await RegistrationService.sendEmailOtp(
      _email.text.trim(), name: _name.text.trim(), phone: _phone.text.trim(), role: widget.role, district: _district,
    );
    if (!mounted) return;
    setState(() { _busy = false; _error = err; if (err == null) { _step = _Step.emailOtp; _code.clear(); } });
  }

  Future<void> _confirmEmail() async {
    setState(() { _error = null; _busy = true; });
    final err = await RegistrationService.verifyEmailOtpAndCreate(
      email: _email.text.trim(), token: _code.text.trim(), role: widget.role,
      name: _name.text.trim(), phone: _phone.text.trim(), district: _district,
    );
    if (!mounted) return;
    if (err != null) { setState(() { _busy = false; _error = err; }); return; }
    // Account created → go to the dashboard.
    Navigator.pushReplacement(context, MaterialPageRoute(
      builder: (_) => _isSponsor ? const SponsorDashboardScreen() : const FreelancerDashboardScreen(),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: Text(_title, style: const TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        if (_step == _Step.form) ..._form() else ..._otp(),
      ]),
    );
  }

  List<Widget> _form() => [
        Text(_isSponsor ? 'Create your sponsor account' : 'Create your freelancer account', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        const Text('Mobile verification required.', style: TextStyle(color: AppColors.muted, fontSize: 12)),
        const SizedBox(height: 16),
        _field(_name, _isSponsor ? 'Key Person Name *' : 'Full Name *'),
        _field(_phone, 'Mobile *', keyboard: TextInputType.phone),
        _field(_email, _isSponsor ? 'Official / Company Email *' : 'Email *', keyboard: TextInputType.emailAddress),
        _dropdown('District', _district, K.tamilNaduDistricts, (v) => setState(() => _district = v)),
        if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
        FilledButton(
          onPressed: _busy ? null : _start,
          style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
          child: Text(_busy ? 'Please wait…' : 'Register', style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
        if (!RegistrationService.phoneOtpAvailable) const Padding(padding: EdgeInsets.only(top: 8), child: Text('Mobile OTP unavailable — we\'ll verify by email instead.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted, fontSize: 10))),
      ];

  List<Widget> _otp() {
    final mobile = _step == _Step.mobileOtp;
    return [
      Text(mobile ? 'Verify your mobile' : 'Verify your email', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
      const SizedBox(height: 4),
      Text('Code sent to ${mobile ? _phone.text.trim() : _email.text.trim()}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
      const SizedBox(height: 16),
      TextField(
        controller: _code, keyboardType: TextInputType.number, textAlign: TextAlign.center,
        style: const TextStyle(color: Colors.white, fontSize: 20, letterSpacing: 8),
        decoration: InputDecoration(hintText: '••••••', hintStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
      ),
      if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
      const SizedBox(height: 16),
      FilledButton(
        onPressed: _busy ? null : (mobile ? _confirmMobile : _confirmEmail),
        style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
        child: Text(_busy ? 'Verifying…' : (mobile ? 'Verify Mobile' : 'Verify & Create Account'), style: const TextStyle(fontWeight: FontWeight.w900)),
      ),
      TextButton(onPressed: () => setState(() { _step = _Step.form; _error = null; }), child: const Text('Edit details', style: TextStyle(color: AppColors.muted))),
    ];
  }

  Widget _field(TextEditingController c, String hint, {TextInputType? keyboard}) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(
          controller: c, keyboardType: keyboard, style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(hintText: hint, hintStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
        ),
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
