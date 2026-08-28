import 'package:flutter/material.dart';
import '../../config/constants.dart';
import '../../config/theme.dart';
import '../../services/freelancer_service.dart';

/// Profile & Documents — edit personal details, roles and portfolio links.
class FreelancerProfileScreen extends StatefulWidget {
  const FreelancerProfileScreen({super.key});
  @override
  State<FreelancerProfileScreen> createState() => _FreelancerProfileScreenState();
}

class _FreelancerProfileScreenState extends State<FreelancerProfileScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _portfolio = TextEditingController();
  final _showreel = TextEditingController();
  final _resume = TextEditingController();

  String _district = 'Chennai';
  Set<String> _roles = {};
  String _phone = '';
  String _status = 'pending';
  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _saved;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final p = await FreelancerService.fetchMyProfile();
    if (!mounted) return;
    if (p == null) {
      setState(() => _loading = false);
      return;
    }
    setState(() {
      _name.text = (p['name'] ?? '').toString();
      _email.text = (p['email'] ?? '').toString();
      _portfolio.text = (p['portfolio_url'] ?? '').toString();
      _showreel.text = (p['showreel_url'] ?? '').toString();
      _resume.text = (p['resume_url'] ?? '').toString();
      _phone = (p['phone'] ?? '').toString();
      _status = (p['status'] ?? 'pending').toString();
      final d = (p['district'] ?? 'Chennai').toString();
      _district = K.tamilNaduDistricts.contains(d) ? d : 'Chennai';
      _roles = ((p['roles'] ?? const []) as List).map((e) => e.toString()).toSet();
      _loading = false;
    });
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _portfolio.dispose();
    _showreel.dispose();
    _resume.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() { _saving = true; _error = null; _saved = null; });
    final err = await FreelancerService.updateProfile(
      name: _name.text,
      email: _email.text,
      district: _district,
      roles: _roles.toList(),
      portfolioUrl: _portfolio.text.trim().isEmpty ? null : _portfolio.text.trim(),
      showreelUrl: _showreel.text.trim().isEmpty ? null : _showreel.text.trim(),
      resumeUrl: _resume.text.trim().isEmpty ? null : _resume.text.trim(),
    );
    if (!mounted) return;
    setState(() {
      _saving = false;
      _error = err;
      if (err == null) _saved = 'Profile updated.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Profile & Documents', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : ListView(padding: const EdgeInsets.all(16), children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
                child: Row(children: [
                  const Icon(Icons.badge, color: AppColors.gold, size: 26),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_phone.isEmpty ? 'Freelancer' : '+91 $_phone',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
                      Text('Status: $_status', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                    ]),
                  ),
                ]),
              ),
              const SizedBox(height: 20),
              const _Label('DETAILS'),
              const SizedBox(height: 10),
              _field(_name, 'Full name'),
              _field(_email, 'Email', keyboard: TextInputType.emailAddress),
              _dropdown(),
              const SizedBox(height: 12),
              const _Label('ROLES'),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: FreelancerService.roles.map((r) {
                  final on = _roles.contains(r);
                  return GestureDetector(
                    onTap: () => setState(() => on ? _roles.remove(r) : _roles.add(r)),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                      decoration: BoxDecoration(
                        color: on ? AppColors.red : AppColors.glass,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(r,
                          style: TextStyle(
                              color: on ? Colors.white : AppColors.muted,
                              fontSize: 12,
                              fontWeight: FontWeight.bold)),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 22),
              const _Label('DOCUMENTS'),
              const SizedBox(height: 10),
              _field(_portfolio, 'Portfolio URL'),
              _field(_showreel, 'Showreel URL'),
              _field(_resume, 'Resume URL'),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12)),
                ),
              if (_saved != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(_saved!, style: const TextStyle(color: Colors.green, fontSize: 12)),
                ),
              FilledButton(
                onPressed: _saving ? null : _save,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.red,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
                child: Text(_saving ? 'Saving...' : 'Save Changes',
                    style: const TextStyle(fontWeight: FontWeight.w900)),
              ),
              const SizedBox(height: 24),
            ]),
    );
  }

  Widget _field(TextEditingController c, String label, {TextInputType? keyboard}) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(
          controller: c,
          keyboardType: keyboard,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            labelText: label,
            labelStyle: const TextStyle(color: AppColors.muted, fontSize: 13),
            filled: true,
            fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
      );

  Widget _dropdown() => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: 'District',
            labelStyle: const TextStyle(color: AppColors.muted, fontSize: 13),
            filled: true,
            fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _district,
              isExpanded: true,
              dropdownColor: AppColors.dark,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              items: K.tamilNaduDistricts
                  .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                  .toList(),
              onChanged: (v) { if (v != null) setState(() => _district = v); },
            ),
          ),
        ),
      );
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold));
}
