import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/freelancer_service.dart';

/// C1 — Freelancer career / apply page. Mirrors web FreelancerCareerScreen.
class FreelancerCareerScreen extends StatefulWidget {
  const FreelancerCareerScreen({super.key});
  @override
  State<FreelancerCareerScreen> createState() => _FreelancerCareerScreenState();
}

class _FreelancerCareerScreenState extends State<FreelancerCareerScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _district = TextEditingController();
  final Set<String> _selected = {};
  bool _busy = false;
  bool _done = false;
  String? _error;

  static const Map<String, String> _pay = {
    'Reporter': '₹500–2,000 / story',
    'Anchor': '₹1,000–5,000 / segment',
    'Writer': '₹300–1,500 / article',
    'Visual Editor': '₹800–3,000 / project',
    'Program Producer': '₹2,000–10,000 / program',
  };

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _district.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() { _busy = true; _error = null; });
    final err = await FreelancerService.apply(
      name: _name.text,
      email: _email.text,
      phone: _phone.text,
      selectedRoles: _selected.toList(),
      district: _district.text.trim().isEmpty ? null : _district.text.trim(),
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
            const Text('Our team will review and reach out. A one-time enrolment fee of ₹1,499 applies on approval.',
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
        const Text('Choose your roles', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        const Text('Vallavan hires reporters, anchors, writers, editors and producers across Tamil Nadu.', style: TextStyle(color: AppColors.muted, fontSize: 12)),
        const SizedBox(height: 16),
        ...FreelancerService.roles.map((r) {
          final on = _selected.contains(r);
          return GestureDetector(
            onTap: () => setState(() => on ? _selected.remove(r) : _selected.add(r)),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: on ? AppColors.red.withValues(alpha: 0.15) : AppColors.glass,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: on ? AppColors.red : Colors.transparent),
              ),
              child: Row(children: [
                Icon(on ? Icons.check_circle : Icons.circle_outlined, color: on ? AppColors.red : AppColors.muted, size: 20),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(r, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  Text(_pay[r] ?? '', style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                ])),
              ]),
            ),
          );
        }),
        const SizedBox(height: 16),
        _field(_name, 'Full name'),
        _field(_email, 'Email', keyboard: TextInputType.emailAddress),
        _field(_phone, 'Phone', keyboard: TextInputType.phone),
        _field(_district, 'District (optional)'),
        if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12))),
        const SizedBox(height: 8),
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
            hintText: hint,
            hintStyle: const TextStyle(color: AppColors.muted),
            filled: true,
            fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
      );
}
