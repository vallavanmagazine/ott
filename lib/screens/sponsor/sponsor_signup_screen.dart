import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../services/sponsor_service.dart';
import 'sponsor_dashboard_screen.dart';

const kBusinessTypes = ['Restaurant', 'Shop', 'Service', 'Brand', 'Other'];

/// Sponsor signup form (FIX 3 — identical fields to web). On mobile, after
/// signup the user continues to the full Sponsor Dashboard (FIX 2).
class SponsorSignupScreen extends StatefulWidget {
  const SponsorSignupScreen({super.key});
  @override
  State<SponsorSignupScreen> createState() => _SponsorSignupScreenState();
}

class _SponsorSignupScreenState extends State<SponsorSignupScreen> {
  final _businessName = TextEditingController();
  final _ownerName = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _gst = TextEditingController();
  String _businessType = 'Restaurant';
  String _district = 'Chennai';
  bool _agree = false;
  bool _busy = false;
  bool _done = false;
  String? _error;

  @override
  void dispose() {
    _businessName.dispose();
    _ownerName.dispose();
    _phone.dispose();
    _email.dispose();
    _gst.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_businessName.text.trim().isEmpty || _ownerName.text.trim().isEmpty || _phone.text.trim().length < 10 || _email.text.trim().isEmpty) {
      setState(() => _error = 'Business name, owner, a valid phone, and email are required.'); return;
    }
    if (!_agree) { setState(() => _error = 'Please agree to the Terms to continue.'); return; }
    setState(() => _busy = true);
    final err = await SponsorService.register(
      businessName: _businessName.text, ownerName: _ownerName.text, phone: _phone.text, email: _email.text,
      businessType: _businessType, district: _district, gstNumber: _gst.text,
    );
    if (!mounted) return;
    setState(() { _busy = false; _error = err; _done = err == null; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Become a Sponsor', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: _done ? _success() : _form(),
    );
  }

  Widget _success() => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.check_circle, color: Color(0xFF66BB6A), size: 64),
            const SizedBox(height: 16),
            const Text("You're registered! 🎉", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            const Text('Open your Sponsor Dashboard to top up your wallet, create campaigns, and view analytics.',
                textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted, fontSize: 13)),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const SponsorDashboardScreen())),
              style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
              child: const Text('Go to Dashboard'),
            ),
          ]),
        ),
      );

  Widget _form() => ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Business Details', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        const Text('Reach Tamil viewers by district.', style: TextStyle(color: AppColors.muted, fontSize: 12)),
        const SizedBox(height: 16),
        _field(_businessName, 'Business Name *'),
        _field(_ownerName, 'Owner Name *'),
        _field(_phone, 'Phone *', keyboard: TextInputType.phone),
        _field(_email, 'Email *', keyboard: TextInputType.emailAddress),
        _dropdown('Business Type', _businessType, kBusinessTypes, (v) => setState(() => _businessType = v)),
        _dropdown('District', _district, K.tamilNaduDistricts, (v) => setState(() => _district = v)),
        _field(_gst, 'GST Number (optional)'),
        CheckboxListTile(
          value: _agree,
          onChanged: (v) => setState(() => _agree = v ?? false),
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
          activeColor: AppColors.red,
          title: const Text('I agree to the Terms & Conditions.', style: TextStyle(color: Colors.white, fontSize: 13)),
        ),
        if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
        FilledButton(
          onPressed: _busy ? null : _submit,
          style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
          child: Text(_busy ? 'Submitting…' : 'Submit', style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
        const SizedBox(height: 24),
      ]);

  Widget _field(TextEditingController c, String hint, {TextInputType? keyboard}) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(
          controller: c,
          keyboardType: keyboard,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint, hintStyle: const TextStyle(color: AppColors.muted),
            filled: true, fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
      );

  Widget _dropdown(String label, String value, List<String> items, ValueChanged<String> onChanged) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: label, labelStyle: const TextStyle(color: AppColors.muted),
            filled: true, fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value, isExpanded: true, dropdownColor: AppColors.glassStrong,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              items: items.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
              onChanged: (v) { if (v != null) onChanged(v); },
            ),
          ),
        ),
      );
}
