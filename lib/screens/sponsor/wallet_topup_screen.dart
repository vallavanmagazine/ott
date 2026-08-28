import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/auth_phone_service.dart';
import '../../services/pricing_service.dart';
import '../../services/razorpay_service.dart';
import '../../services/wallet_service.dart';

/// Wallet top-up with in-app Razorpay checkout.
///
/// Flow: pick amount -> Razorpay sheet -> on success credit the wallet in
/// Supabase (idempotent on the payment id) and generate an invoice.
class WalletTopUpScreen extends StatefulWidget {
  const WalletTopUpScreen({super.key});
  @override
  State<WalletTopUpScreen> createState() => _WalletTopUpScreenState();
}

class _WalletTopUpScreenState extends State<WalletTopUpScreen> {
  int _amount = 4999;
  bool _busy = false;
  String? _error;
  String? _success;
  WalletView _wallet = WalletView.empty;
  final _custom = TextEditingController();

  static const _tiers = [(min: 5000, pct: 10), (min: 10000, pct: 20), (min: 25000, pct: 30)];

  @override
  void initState() {
    super.initState();
    WalletService.fetch().then((w) { if (mounted) setState(() => _wallet = w); });
  }

  @override
  void dispose() {
    _custom.dispose();
    super.dispose();
  }

  Future<void> _pay() async {
    setState(() { _error = null; _success = null; });

    if (_amount < PricingService.minTopupRupees) {
      setState(() => _error = 'Minimum top-up is Rs.${PricingService.minTopupRupees}.');
      return;
    }
    if (!RazorpayService.isConfigured) {
      setState(() => _error = 'Payments are not configured for this build.');
      return;
    }

    setState(() => _busy = true);
    final session = await AuthPhone.currentSession();

    final result = await RazorpayService.checkout(
      amountRupees: _amount,
      description: 'Ad Campaign Wallet Top-up',
      contact: session?.phone,
      email: session?.email,
    );

    if (!mounted) return;

    if (!result.ok) {
      setState(() { _busy = false; _error = result.error; });
      return;
    }

    final err = await WalletService.creditTopUp(
      amountRupees: _amount,
      reference: result.paymentId ?? 'rzp-${DateTime.now().millisecondsSinceEpoch}',
    );
    final wallet = await WalletService.fetch();
    if (!mounted) return;

    setState(() {
      _busy = false;
      _wallet = wallet;
      if (err != null) {
        // The payment went through; only the ledger write failed.
        _error = 'Payment succeeded but crediting the wallet failed: $err\n'
            'Reference: ${result.paymentId}. Please contact support with this id.';
      } else {
        final bonus = PricingService.walletBonusRupees(_amount);
        _success = bonus > 0
            ? 'Rs.${_amount + bonus} credited (Rs.$_amount + Rs.$bonus bonus).'
            : 'Rs.$_amount credited to your wallet.';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final bonus = PricingService.walletBonusRupees(_amount);
    final credited = _amount + bonus;
    final toNextTier = _amount < 5000 ? 5000 - _amount : 0;

    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Top Up Wallet', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.glassStrong,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
          ),
          child: Row(children: [
            const Icon(Icons.account_balance_wallet, color: AppColors.gold, size: 26),
            const SizedBox(width: 12),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('CURRENT BALANCE',
                  style: TextStyle(fontSize: 9, letterSpacing: 1.2, color: AppColors.muted, fontWeight: FontWeight.bold)),
              Text('Rs.${_wallet.balanceRupees}',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white)),
            ]),
          ]),
        ),
        const SizedBox(height: 20),
        const _Label('CHOOSE AMOUNT'),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: PricingService.topupPresets.map((p) {
            final on = _amount == p;
            return GestureDetector(
              onTap: () => setState(() { _amount = p; _custom.clear(); }),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
                decoration: BoxDecoration(
                  color: on ? AppColors.red : AppColors.glass,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: on ? AppColors.red : Colors.white12),
                ),
                child: Text('Rs.$p',
                    style: TextStyle(
                        color: on ? Colors.white : AppColors.muted, fontWeight: FontWeight.bold)),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _custom,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Custom amount (Rs.)',
            labelStyle: const TextStyle(color: AppColors.muted),
            filled: true,
            fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
          onChanged: (v) => setState(() => _amount = int.tryParse(v) ?? 0),
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.gold.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.card_giftcard, color: AppColors.gold, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  bonus > 0
                      ? '+Rs.$bonus bonus'
                      : (toNextTier > 0
                          ? 'Add Rs.$toNextTier more for a 10% bonus'
                          : 'No bonus at this amount'),
                  style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ]),
            const SizedBox(height: 4),
            Text("You'll be credited Rs.$credited after payment.",
                style: const TextStyle(color: Colors.white70, fontSize: 11)),
          ]),
        ),
        const SizedBox(height: 12),
        Row(
          children: _tiers.map((t) {
            final on = _amount >= t.min;
            return Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 3),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: on ? AppColors.gold.withValues(alpha: 0.2) : AppColors.glass,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(children: [
                  Text('${t.pct}%',
                      style: TextStyle(
                          color: on ? AppColors.gold : Colors.white, fontWeight: FontWeight.w900)),
                  Text('Rs.${t.min ~/ 1000}K+',
                      style: const TextStyle(color: AppColors.muted, fontSize: 9)),
                ]),
              ),
            );
          }).toList(),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 14),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.red.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12)),
            ),
          ),
        if (_success != null)
          Padding(
            padding: const EdgeInsets.only(top: 14),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_success!, style: const TextStyle(color: Colors.green, fontSize: 12)),
                ),
              ]),
            ),
          ),
        const SizedBox(height: 18),
        FilledButton(
          onPressed: _busy ? null : _pay,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.red,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          ),
          child: Text(_busy ? 'Opening checkout...' : 'Pay Rs.$_amount with Razorpay',
              style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
        const Padding(
          padding: EdgeInsets.only(top: 10),
          child: Text('Secured by Razorpay. Card details are never stored by Vallavan.',
              textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted, fontSize: 10)),
        ),
        if (_wallet.transactions.isNotEmpty) ...[
          const SizedBox(height: 26),
          const _Label('RECENT TRANSACTIONS'),
          const SizedBox(height: 8),
          ..._wallet.transactions.take(8).map((t) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(children: [
                  Icon(t.isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                      size: 15, color: t.isCredit ? Colors.green : AppColors.red),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(t.kind.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                  Text(t.date, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                  const SizedBox(width: 12),
                  Text('${t.isCredit ? '+' : '-'}Rs.${t.amountRupees}',
                      style: TextStyle(
                          color: t.isCredit ? Colors.green : AppColors.red,
                          fontSize: 12,
                          fontWeight: FontWeight.bold)),
                ]),
              )),
        ],
        const SizedBox(height: 24),
      ]),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold));
}
