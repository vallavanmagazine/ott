import 'api_service.dart';

/// AI support chat client (FIX 4). Talks to the NestJS backend which holds the
/// Anthropic key + Vallavan system prompt. No phone/WhatsApp — email only.
class ChatMsg {
  final String role; // 'user' | 'assistant'
  final String content;
  const ChatMsg(this.role, this.content);
  Map<String, String> toJson() => {'role': role, 'content': content};
}

class ChatService {
  static const supportEmail = 'support@vallavan.in';

  static Future<String> send(List<ChatMsg> messages, {String variant = 'general'}) async {
    if (!Api.hasBackend) {
      return 'The AI assistant needs the backend configured (API_BASE_URL). Meanwhile, email us at $supportEmail and our team will help.';
    }
    try {
      final res = await Api.post('/api/ai/chat', {
        'messages': messages.map((m) => m.toJson()).toList(),
        'variant': variant,
      });
      final reply = (res['reply'] ?? '').toString().trim();
      return reply.isEmpty ? 'Sorry, please try again or email $supportEmail.' : reply;
    } catch (_) {
      return "Sorry, I couldn't reach the assistant. Please email $supportEmail and our team will contact you.";
    }
  }
}
