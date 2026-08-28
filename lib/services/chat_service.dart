import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/env.dart';
import 'api_service.dart';

/// One turn in an assistant conversation.
class ChatMsg {
  final String role; // 'user' | 'assistant'
  final String content;
  const ChatMsg(this.role, this.content);
  Map<String, String> toJson() => {'role': role, 'content': content};
}

/// AI assistant client for the sponsor and freelancer dashboards.
///
/// Transport preference:
///   1. `API_BASE_URL` — the backend holds the Anthropic key server-side.
///   2. `ANTHROPIC_API_KEY` — a direct client call, DEV ONLY. A key compiled
///      into an APK is recoverable with `strings`, so this path exists for
///      local testing and should not be used for a Play Store build.
///   3. Neither configured — a helpful message pointing at support.
class ChatService {
  static const supportEmail = 'support@vallavan.in';
  static const _endpoint = 'https://api.anthropic.com/v1/messages';
  static const _version = '2023-06-01';

  /// Role-specific system prompts. Kept here so both dashboards stay in sync
  /// with the pricing and commission numbers the rest of the app uses.
  static String systemPrompt(String variant) {
    const base =
        'You are the assistant for Vallavan, a Tamil-first documentary streaming '
        'service in Tamil Nadu, India. Vallavan is free for viewers and funded by '
        'sponsors. Be concise, practical and warm. Reply in the language the user '
        'writes in (Tamil or English). Amounts are in Indian rupees.';

    switch (variant) {
      case 'sponsor':
        return '$base\n\n'
            'You are the Ad Assistant for a SPONSOR. Help them write ad creative, '
            'plan campaigns, pick districts and understand pricing.\n'
            'Geo-targeted daily rates: 1 district Rs.99/day, 5 districts Rs.199/day, '
            '15 districts Rs.399/day, all Tamil Nadu Rs.799/day. '
            'Minimum wallet top-up Rs.999. Wallet bonuses: Rs.5,000+ gets 10%, '
            'Rs.10,000+ gets 20%, Rs.25,000+ gets 30%. '
            'Ads run as pre-roll and mid-roll video spots plus feed strip and banner '
            'placements. Never promise reach numbers you have not been given.';
      case 'freelancer':
        return '$base\n\n'
            'You are the Freelancer Assistant. Help with picking tasks, submitting '
            'content, deadlines, payments and earnings.\n'
            'Freelancer roles: Reporter, Anchor, Writer, Visual Editor, Program '
            'Producer, Telecaller, Field Executive. '
            'Magazine reselling: copies cost Rs.14 and sell at Rs.20. '
            'Ad sales earn 20% commission. '
            'Submissions are a video URL plus a thumbnail URL against an assignment. '
            'For payout disputes, tell them to contact $supportEmail.';
      default:
        return '$base\n\nHelp with advertising, freelancing, or using the app.';
    }
  }

  static Future<String> send(List<ChatMsg> messages, {String variant = 'general'}) async {
    if (Api.hasBackend) return _viaBackend(messages, variant);
    if (Env.anthropicKey.isNotEmpty) return _viaAnthropic(messages, variant);
    return 'The AI assistant is not configured for this build yet. '
        'Email us at $supportEmail and our team will help you right away.';
  }

  static Future<String> _viaBackend(List<ChatMsg> messages, String variant) async {
    try {
      final res = await Api.post('/api/ai/chat', {
        'messages': messages.map((m) => m.toJson()).toList(),
        'variant': variant,
      });
      final reply = (res['reply'] ?? '').toString().trim();
      return reply.isEmpty ? 'Sorry, please try again or email $supportEmail.' : reply;
    } catch (_) {
      return _unreachable;
    }
  }

  static Future<String> _viaAnthropic(List<ChatMsg> messages, String variant) async {
    try {
      // The Messages API takes the system prompt as a top-level field, not as a
      // message with role 'system'. Only user/assistant turns go in `messages`.
      final turns = messages
          .where((m) => m.role == 'user' || m.role == 'assistant')
          .map((m) => {
                'role': m.role,
                'content': m.content,
              })
          .toList();
      if (turns.isEmpty || turns.first['role'] != 'user') {
        // The API requires the first turn to be from the user; the screen seeds
        // the conversation with an assistant greeting, so drop it.
        while (turns.isNotEmpty && turns.first['role'] != 'user') {
          turns.removeAt(0);
        }
      }
      if (turns.isEmpty) return 'Ask me anything to get started.';

      final res = await http
          .post(
            Uri.parse(_endpoint),
            headers: {
              'content-type': 'application/json',
              'x-api-key': Env.anthropicKey,
              'anthropic-version': _version,
            },
            body: jsonEncode({
              'model': Env.anthropicModel,
              'max_tokens': 1024,
              'system': systemPrompt(variant),
              'messages': turns,
            }),
          )
          .timeout(const Duration(seconds: 45));

      if (res.statusCode < 200 || res.statusCode >= 300) return _unreachable;

      final body = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      final blocks = (body['content'] as List?) ?? const [];
      final text = blocks
          .whereType<Map<String, dynamic>>()
          .where((b) => b['type'] == 'text')
          .map((b) => (b['text'] ?? '').toString())
          .join()
          .trim();
      return text.isEmpty ? 'Sorry, please try again or email $supportEmail.' : text;
    } catch (_) {
      return _unreachable;
    }
  }

  static const _unreachable =
      "Sorry, I couldn't reach the assistant just now. Please try again, or email "
      '$supportEmail and our team will contact you.';
}
