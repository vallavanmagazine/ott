import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';
import '../config/theme.dart';
import '../services/chat_service.dart';

/// FIX 4 — AI Assistant chatbot. Combines Help & Support + AI Assistant into
/// one screen. Text + voice input (speech_to_text). No phone/WhatsApp.
class AIChatbotScreen extends StatefulWidget {
  const AIChatbotScreen({super.key});
  @override
  State<AIChatbotScreen> createState() => _AIChatbotScreenState();
}

class _AIChatbotScreenState extends State<AIChatbotScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final _speech = SpeechToText();
  final List<ChatMsg> _messages = [
    const ChatMsg('assistant', "Hi! I'm the Vallavan AI Assistant 🤖 — I can help with advertising options, freelancer questions, or using the app. How can I help?"),
  ];
  bool _busy = false;
  bool _speechReady = false;
  bool _listening = false;

  @override
  void initState() {
    super.initState();
    _initSpeech();
  }

  Future<void> _initSpeech() async {
    try {
      final ok = await _speech.initialize(onStatus: (s) {
        if (s == 'done' || s == 'notListening') { if (mounted) setState(() => _listening = false); }
      }, onError: (_) { if (mounted) setState(() => _listening = false); });
      if (mounted) setState(() => _speechReady = ok);
    } catch (_) {
      if (mounted) setState(() => _speechReady = false);
    }
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    });
  }

  Future<void> _send(String text) async {
    final t = text.trim();
    if (t.isEmpty || _busy) return;
    setState(() { _messages.add(ChatMsg('user', t)); _busy = true; _input.clear(); });
    _scrollDown();
    final reply = await ChatService.send(_messages);
    if (!mounted) return;
    setState(() { _messages.add(ChatMsg('assistant', reply)); _busy = false; });
    _scrollDown();
  }

  Future<void> _toggleMic() async {
    if (_listening) { await _speech.stop(); setState(() => _listening = false); return; }
    if (!_speechReady) return;
    setState(() => _listening = true);
    await _speech.listen(
      listenOptions: SpeechListenOptions(localeId: 'en_IN'),
      onResult: (r) { if (r.finalResult && r.recognizedWords.isNotEmpty) _send(r.recognizedWords); },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('AI Assistant', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: Column(children: [
        Expanded(child: ListView.builder(
          controller: _scroll,
          padding: const EdgeInsets.all(16),
          itemCount: _messages.length + (_busy ? 1 : 0),
          itemBuilder: (ctx, i) {
            if (i >= _messages.length) return _bubble(const ChatMsg('assistant', '…'));
            return _bubble(_messages[i]);
          },
        )),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Text('Our AI assistant helps 24/7 · Email ${ChatService.supportEmail}', style: TextStyle(color: AppColors.muted, fontSize: 10)),
        ),
        Container(
          padding: EdgeInsets.only(left: 12, right: 12, top: 8, bottom: MediaQuery.of(context).padding.bottom + 8),
          decoration: const BoxDecoration(border: Border(top: BorderSide(color: Colors.white12))),
          child: Row(children: [
            if (_speechReady)
              GestureDetector(
                onTap: _toggleMic,
                child: Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(color: _listening ? AppColors.red : AppColors.glass, shape: BoxShape.circle),
                  child: Icon(_listening ? Icons.mic_off : Icons.mic, color: _listening ? Colors.white : AppColors.muted, size: 20),
                ),
              ),
            if (_speechReady) const SizedBox(width: 8),
            Expanded(child: TextField(
              controller: _input,
              style: const TextStyle(color: Colors.white),
              textInputAction: TextInputAction.send,
              onSubmitted: _send,
              decoration: InputDecoration(
                hintText: 'Ask anything…', hintStyle: const TextStyle(color: AppColors.muted),
                filled: true, fillColor: AppColors.glass,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
            )),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => _send(_input.text),
              child: Container(
                width: 44, height: 44,
                decoration: const BoxDecoration(color: AppColors.red, shape: BoxShape.circle),
                child: const Icon(Icons.send, color: Colors.white, size: 20),
              ),
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _bubble(ChatMsg m) {
    final isUser = m.role == 'user';
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          color: isUser ? AppColors.red : AppColors.glass,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16), topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isUser ? 16 : 4), bottomRight: Radius.circular(isUser ? 4 : 16),
          ),
        ),
        child: Text(m.content, style: TextStyle(color: isUser ? Colors.white : Colors.white.withValues(alpha: 0.92), fontSize: 14, height: 1.4)),
      ),
    );
  }
}
