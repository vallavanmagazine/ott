import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/ad_content.dart';
import '../../services/chat_service.dart';
import '../../services/sponsor_service.dart';
import '../../widgets/ad_banner.dart';

/// AI Studio — describe the business, let the assistant draft the ad copy,
/// review and edit it, then save it to the Creative Library.
///
/// The model is asked for `KEY: value` lines rather than JSON: chat models emit
/// prose around JSON often enough that line parsing is the more robust target,
/// and a partial parse still fills most of the form.
class AiStudioScreen extends StatefulWidget {
  const AiStudioScreen({super.key});
  @override
  State<AiStudioScreen> createState() => _AiStudioScreenState();
}

class _AiStudioScreenState extends State<AiStudioScreen> {
  final _brief = TextEditingController();
  final _headline = TextEditingController();
  final _body = TextEditingController();
  final _cta = TextEditingController(text: 'Learn More');
  final _image = TextEditingController(text: '30004134');

  bool _generating = false;
  bool _saving = false;
  String? _error;
  String? _rawReply;
  String _sponsorName = 'Sponsor';

  @override
  void initState() {
    super.initState();
    SponsorService.fetchProfile().then((p) {
      if (mounted && p != null) setState(() => _sponsorName = (p['name'] ?? 'Sponsor').toString());
    });
  }

  @override
  void dispose() {
    _brief.dispose();
    _headline.dispose();
    _body.dispose();
    _cta.dispose();
    _image.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    final brief = _brief.text.trim();
    if (brief.isEmpty) {
      setState(() => _error = 'Describe your business or offer first.');
      return;
    }
    setState(() { _generating = true; _error = null; _rawReply = null; });

    final prompt = 'Write one advertisement for this business, to run on Vallavan, '
        'a Tamil documentary streaming service in Tamil Nadu.\n\n'
        'Business brief: $brief\n\n'
        'Reply with exactly these four lines and nothing else:\n'
        'HEADLINE: <max 8 words, punchy>\n'
        'BODY: <max 25 words>\n'
        'CTA: <2-3 words, e.g. Order Now>\n'
        'TAMIL: <the headline translated to Tamil>';

    final reply = await ChatService.send([ChatMsg('user', prompt)], variant: 'sponsor');
    if (!mounted) return;

    final parsed = _parse(reply);
    setState(() {
      _generating = false;
      if (parsed.isEmpty) {
        // Nothing machine-readable came back — show the raw text so the copy
        // is still usable rather than leaving the sponsor with nothing.
        _rawReply = reply;
        _error = 'Could not read a structured ad from the reply. The full response is below.';
      } else {
        if (parsed['HEADLINE'] != null) _headline.text = parsed['HEADLINE']!;
        if (parsed['BODY'] != null) _body.text = parsed['BODY']!;
        if (parsed['CTA'] != null) _cta.text = parsed['CTA']!;
        if (parsed['TAMIL'] != null) _rawReply = 'Tamil headline: ${parsed['TAMIL']}';
      }
    });
  }

  /// Pulls `KEY: value` pairs out of the reply, ignoring surrounding prose and
  /// any markdown emphasis the model may have added.
  Map<String, String> _parse(String reply) {
    const keys = ['HEADLINE', 'BODY', 'CTA', 'TAMIL'];
    final out = <String, String>{};
    for (final line in reply.split('\n')) {
      final clean = line.replaceAll('*', '').replaceAll('#', '').trim();
      for (final k in keys) {
        if (out.containsKey(k)) continue;
        final prefix = '$k:';
        if (clean.toUpperCase().startsWith(prefix)) {
          final v = clean.substring(prefix.length).trim();
          if (v.isNotEmpty) out[k] = v;
        }
      }
    }
    return out;
  }

  Future<void> _save() async {
    if (_headline.text.trim().isEmpty) {
      setState(() => _error = 'A headline is required before saving.');
      return;
    }
    setState(() { _saving = true; _error = null; });
    final err = await SponsorService.createCreative(
      sponsorName: _sponsorName,
      headline: _headline.text,
      body: _body.text,
      cta: _cta.text,
      bgImage: _image.text,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    if (err != null) {
      setState(() => _error = err);
      return;
    }
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Saved to your Creative Library.')));
    Navigator.pop(context);
  }

  AdContent get _preview => AdContent(
        id: 'preview',
        sponsor: _sponsorName,
        sponsorLogo: '',
        headline: _headline.text.trim().isEmpty ? 'Your headline here' : _headline.text.trim(),
        body: _body.text.trim().isEmpty ? 'Your ad body copy appears here.' : _body.text.trim(),
        cta: _cta.text.trim().isEmpty ? 'Learn More' : _cta.text.trim(),
        bgImage: _image.text.trim().isEmpty ? '30004134' : _image.text.trim(),
        accent: '#D32F2F',
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('AI Studio', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Describe your business and the assistant will draft the ad copy.',
            style: TextStyle(color: AppColors.muted, fontSize: 13)),
        const SizedBox(height: 14),
        TextField(
          controller: _brief,
          maxLines: 3,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'e.g. A family jewellery shop in Madurai, 40 years old, '
                'running a wedding season discount on gold chains.',
            hintStyle: const TextStyle(color: AppColors.muted, fontSize: 13),
            filled: true,
            fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: _generating ? null : _generate,
          icon: const Icon(Icons.auto_awesome, size: 18),
          label: Text(_generating ? 'Generating...' : 'Generate Ad Copy'),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.gold,
            foregroundColor: Colors.black,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12)),
          ),
        if (_rawReply != null)
          Container(
            margin: const EdgeInsets.only(top: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(10)),
            child: SelectableText(_rawReply!,
                style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4)),
          ),
        const SizedBox(height: 22),
        const Text('PREVIEW',
            style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        AdBanner(ad: _preview),
        const SizedBox(height: 20),
        _field(_headline, 'Headline'),
        _field(_body, 'Body copy', lines: 2),
        _field(_cta, 'Call to action'),
        _field(_image, 'Image (Pexels photo id or full URL)'),
        const SizedBox(height: 10),
        FilledButton(
          onPressed: _saving ? null : _save,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.red,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          ),
          child: Text(_saving ? 'Saving...' : 'Save to Creative Library',
              style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
        const SizedBox(height: 24),
      ]),
    );
  }

  Widget _field(TextEditingController c, String label, {int lines = 1}) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
          controller: c,
          maxLines: lines,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            labelText: label,
            labelStyle: const TextStyle(color: AppColors.muted, fontSize: 13),
            filled: true,
            fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
      );
}
