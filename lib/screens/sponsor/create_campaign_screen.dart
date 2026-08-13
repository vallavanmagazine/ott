import 'package:flutter/material.dart';
import '../../config/constants.dart';
import '../../config/theme.dart';
import '../../services/supabase_client.dart';

class CreateCampaignScreen extends StatefulWidget {
  const CreateCampaignScreen({super.key});
  @override
  State<CreateCampaignScreen> createState() => _CreateCampaignScreenState();
}

class _CreateCampaignScreenState extends State<CreateCampaignScreen> {
  final _name = TextEditingController();
  double _budget = 15000;
  final Set<String> _districts = {'Chennai', 'Coimbatore', 'Madurai'};
  bool _submitting = false;

  @override
  void dispose() { _name.dispose(); super.dispose(); }

  Future<void> _submit() async {
    final c = Db.client;
    if (c == null) return;
    setState(() => _submitting = true);
    try {
      final user = c.auth.currentUser;
      String? sponsorId;
      if (user != null) {
        final s = await c.from('sponsors').select('id').eq('owner_id', user.id).maybeSingle();
        sponsorId = s?['id']?.toString();
      }
      if (sponsorId == null) throw Exception('No sponsor profile linked to this account.');
      await c.from('campaigns').insert({
        'sponsor_id': sponsorId,
        'name': _name.text.trim().isEmpty ? 'Untitled Campaign' : _name.text.trim(),
        'status': 'Pending Approval',
        'budget_paise': (_budget * 100).round(),
        'target_districts': _districts.toList(),
        'start_date': DateTime.now().toIso8601String().substring(0, 10),
        'submitted_at': DateTime.now().toIso8601String(),
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Create Campaign', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        TextField(controller: _name, style: const TextStyle(color: Colors.white), decoration: InputDecoration(hintText: 'Campaign name', hintStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none))),
        const SizedBox(height: 20),
        Text('Budget: ₹${_budget.round()}', style: const TextStyle(color: AppColors.gold, fontSize: 18, fontWeight: FontWeight.w900)),
        Slider(value: _budget, min: 5000, max: 100000, divisions: 95, activeColor: AppColors.red, onChanged: (v) => setState(() => _budget = v)),
        const SizedBox(height: 12),
        Text('Target Districts (${_districts.length})', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: K.tamilNaduDistricts.map((d) {
          final sel = _districts.contains(d);
          return GestureDetector(
            onTap: () => setState(() => sel ? _districts.remove(d) : _districts.add(d)),
            child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7), decoration: BoxDecoration(color: sel ? AppColors.red : AppColors.glass, borderRadius: BorderRadius.circular(999)), child: Text(d, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: sel ? Colors.white : AppColors.muted))),
          );
        }).toList()),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _submitting ? null : _submit,
          style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
          child: Text(_submitting ? 'Submitting…' : 'Submit for Approval'),
        ),
        const SizedBox(height: 24),
      ]),
    );
  }
}
