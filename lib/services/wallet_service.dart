import '../utils/formatters.dart';
import 'pricing_service.dart';
import 'sponsor_service.dart';
import 'supabase_client.dart';

class WalletTxn {
  final String id;
  final int amountRupees;
  final String kind; // topup | bonus | spend | refund
  final String date;
  const WalletTxn({required this.id, required this.amountRupees, required this.kind, required this.date});

  factory WalletTxn.fromMap(Map<String, dynamic> r) => WalletTxn(
        id: r['id'].toString(),
        amountRupees: paiseToRupees((r['amount_paise'] ?? 0) as num),
        kind: (r['kind'] ?? 'topup').toString(),
        date: formatDate(r['created_at']?.toString()),
      );

  bool get isCredit => kind == 'topup' || kind == 'bonus' || kind == 'refund';
}

class WalletView {
  final int balanceRupees;
  final List<WalletTxn> transactions;
  const WalletView(this.balanceRupees, this.transactions);
  static const empty = WalletView(0, []);
}

/// Sponsor wallet reads plus the post-payment credit. Mirrors the web
/// `services/sponsor.ts` wallet section, including its idempotency contract.
class WalletService {
  static Future<WalletView> fetch() async {
    final c = Db.client;
    final sponsorId = await SponsorService.currentSponsorId();
    if (c == null || sponsorId == null) return WalletView.empty;
    try {
      final wallet = await c.from('wallets').select('balance_paise').eq('sponsor_id', sponsorId).maybeSingle();
      final txns = await c
          .from('wallet_transactions')
          .select('id, amount_paise, kind, created_at')
          .eq('sponsor_id', sponsorId)
          .order('created_at', ascending: false)
          .limit(50);
      return WalletView(
        paiseToRupees((wallet?['balance_paise'] ?? 0) as num),
        (txns as List).map((r) => WalletTxn.fromMap(r as Map<String, dynamic>)).toList(),
      );
    } catch (_) {
      return WalletView.empty;
    }
  }

  /// Credit the wallet after a successful Razorpay payment.
  ///
  /// Idempotent on [reference] (the Razorpay payment id): if a topup with that
  /// reference already exists, nothing is written. This protects against retries
  /// and duplicate success callbacks.
  ///
  /// Returns null on success, an error string otherwise.
  static Future<String?> creditTopUp({
    required int amountRupees,
    required String reference,
  }) async {
    final c = Db.client;
    if (c == null) return 'Service not configured.';
    final sponsorId = await SponsorService.currentSponsorId();
    if (sponsorId == null) return 'No sponsor profile linked to this account.';

    final bonusRupees = PricingService.walletBonusRupees(amountRupees);
    final paise = amountRupees * 100;
    final bonusPaise = bonusRupees * 100;

    try {
      final existing = await c
          .from('wallet_transactions')
          .select('id')
          .eq('kind', 'topup')
          .eq('reference', reference)
          .maybeSingle();
      if (existing != null) return null; // already credited

      await c.from('wallet_transactions').insert({
        'sponsor_id': sponsorId,
        'amount_paise': paise,
        'kind': 'topup',
        'reference': reference,
      });

      // The bonus is a separate row so the ledger distinguishes money paid from
      // money gifted.
      if (bonusPaise > 0) {
        await c.from('wallet_transactions').insert({
          'sponsor_id': sponsorId,
          'amount_paise': bonusPaise,
          'kind': 'bonus',
          'reference': '$reference-bonus',
        });
      }

      final w = await c.from('wallets').select('balance_paise').eq('sponsor_id', sponsorId).maybeSingle();
      final current = ((w?['balance_paise'] ?? 0) as num).toInt();
      await c.from('wallets').upsert({
        'sponsor_id': sponsorId,
        'balance_paise': current + paise + bonusPaise,
        'updated_at': DateTime.now().toIso8601String(),
      }, onConflict: 'sponsor_id');

      await _createInvoice(sponsorId, amountRupees, bonusRupees, reference);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  /// Best-effort invoice row. A failure here must not surface as a payment
  /// failure — the money has already been credited by this point.
  static Future<void> _createInvoice(
    String sponsorId,
    int amountRupees,
    int bonusRupees,
    String reference,
  ) async {
    final c = Db.client;
    if (c == null) return;
    try {
      await c.from('invoices').insert({
        'sponsor_id': sponsorId,
        'total_paise': amountRupees * 100,
        'kind': 'wallet_topup',
        'reference': reference,
        'notes': bonusRupees > 0 ? 'Includes Rs.$bonusRupees promotional bonus credit' : null,
        'status': 'paid',
      });
    } catch (_) {
      // Invoice table may not exist in every environment — non-fatal.
    }
  }

  static Future<List<Map<String, dynamic>>> fetchInvoices() async {
    final c = Db.client;
    final sponsorId = await SponsorService.currentSponsorId();
    if (c == null || sponsorId == null) return const [];
    try {
      final data = await c
          .from('invoices')
          .select()
          .eq('sponsor_id', sponsorId)
          .order('created_at', ascending: false)
          .limit(50);
      return (data as List).cast<Map<String, dynamic>>();
    } catch (_) {
      return const [];
    }
  }
}
