import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../services/freelancer_service.dart';

/// C1 — Freelancer career / apply page. Fields identical to web (FIX 3).
class FreelancerCareerScreen extends StatefulWidget {
  const FreelancerCareerScreen({super.key});
  @override
  State<FreelancerCareerScreen> createState() => _FreelancerCareerScreenState();
}

class _FreelancerCareerScreenState extends State<FreelancerCareerScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _experience = TextEditingController(text: '0');
  final _portfolio = TextEditingController();
  final _showreel = TextEditingController();
  final _resume = TextEditingController();
  String _district = 'Chennai';
  final Set<String> _selected = {};
  bool _agree = false;
  bool _busy = false;
  bool _done = false;
  String? _error;

  static const Map<String, String> _pay = {
    'Reporter': '₹1,500–5,000 / story',
    'Anchor': '₹2,000–8,000 / shoot',
    'Writer': '₹1,000–4,000 / script',
    'Visual Editor': '₹2,000–10,000 / project',
    'Program Producer': '₹5,000–20,000 / project',
  };

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _experience.dispose();
    _portfolio.dispose();
    _showreel.dispose();
    _resume.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_name.text.trim().isEmpty || _phone.text.trim().isEmpty || _email.text.trim().isEmpty || _selected.isEmpty) {
      setState(() => _error = 'Name, phone, email and at least one role are required.'); return;
    }
    if (!_agree) { setState(() => _error = 'Please agree to the Terms to continue.'); return; }
    setState(() => _busy = true);
    final err = await FreelancerService.apply(
      name: _name.text,
      email: _email.text,
      phone: _phone.text,
      selectedRoles: _selected.toList(),
      district: _district,
      experienceYears: int.tryParse(_experience.text.trim()) ?? 0,
      portfolioUrl: _portfolio.text.trim().isEmpty ? null : _portfolio.text.trim(),
      showreelUrl: _showreel.text.trim().isEmpty ? null : _showreel.text.trim(),
      resumeUrl: _resume.text.trim().isEmpty ? null : _resume.text.trim(),
    );
    if (!mounted) return;
    setState(() { _busy = false; _error = err; _done = err == null; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Join as Freelancer', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: _done ? _success() : _form(),
    );
  }

  Widget _success() => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.check_circle, color: AppColors.gold, size: 64),
            const SizedBox(height: 16),
            const Text('Application submitted!', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            const Text('Our team will review and reach out by email. A one-time enrolment fee of ₹1,499 applies on approval, then your Freelancer Dashboard unlocks.',
                textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted, fontSize: 13)),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => Navigator.pop(context),
              style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
              child: const Text('Done'),
            ),
          ]),
        ),
      );

  Widget _form() => ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Apply to freelance with Vallavan', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        const Text('Reporters, anchors, writers, editors and producers across Tamil Nadu.', style: TextStyle(color: AppColors.muted, fontSize: 12)),
        const SizedBox(height: 16),
        _field(_name, 'Full Name *'),
        _field(_phone, 'Phone *', keyboard: TextInputType.phone),
        _field(_email, 'Email *', keyboard: TextInputType.emailAddress),
        _dropdown('District', _district, K.tamilNaduDistricts, (v) => setState(() => _district = v)),
        const Padding(padding: EdgeInsets.only(bottom: 8, top: 4), child: Text('Roles applying for *', style: TextStyle(color: AppColors.muted, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1))),
        Wrap(spacing: 8, runSpacing: 8, children: FreelancerService.roles.map((r) {
          final on = _selected.contains(r);
          return GestureDetector(
            onTap: () => setState(() => on ? _selected.remove(r) : _selected.add(r)),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: on ? AppColors.red : AppColors.glass, borderRadius: BorderRadius.circular(999),
                border: Border.all(color: on ? AppColors.red : Colors.transparent),
              ),
              child: Text(r, style: TextStyle(color: on ? Colors.white : AppColors.muted, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          );
        }).toList()),
        if (_selected.isNotEmpty) Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(_selected.map((r) => _pay[r]).where((p) => p != null).join(' · '), style: const TextStyle(color: AppColors.gold, fontSize: 11)),
        ),
        const SizedBox(height: 14),
        _field(_experience, 'Experience (years)', keyboard: TextInputType.number),
        _field(_portfolio, 'Portfolio URL (optional)'),
        _field(_showreel, 'Showreel URL (optional)'),
        _field(_resume, 'Resume URL (optional)'),
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
          child: Text(_busy ? 'Submitting…' : 'Submit Application', style: const TextStyle(fontWeight: FontWeight.w900)),
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
