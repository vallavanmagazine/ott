import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/wallet_service.dart';
import '../../utils/formatters.dart';
import 'wallet_topup_screen.dart';

/// Billing & Wallet — balance, transaction ledger and invoices.
class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});
  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  WalletView _wallet = WalletView.empty;
  List<Map<String, dynamic>> _invoices = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final wallet = await WalletService.fetch();
    final invoices = await WalletService.fetchInvoices();
    if (mounted) setState(() { _wallet = wallet; _invoices = invoices; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Billing & Wallet', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : RefreshIndicator(
              color: AppColors.red,
              backgroundColor: AppColors.dark,
              onRefresh: _load,
              child: ListView(padding: const EdgeInsets.all(16), children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.gold.withValues(alpha: 0.2), AppColors.dark],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('WALLET BALANCE',
                        style: TextStyle(
                            fontSize: 9, letterSpacing: 1.2, color: AppColors.muted, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Rs.${_wallet.balanceRupees}',
                        style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w900, color: Colors.white)),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: () async {
                          await Navigator.push(context,
                              MaterialPageRoute<void>(builder: (_) => const WalletTopUpScreen()));
                          if (mounted) _load();
                        },
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Top Up Wallet'),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.red,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                        ),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 22),
                const _Label('TRANSACTIONS'),
                const SizedBox(height: 10),
                if (_wallet.transactions.isEmpty)
                  const _Empty('No transactions yet.')
                else
                  ..._wallet.transactions.map(_txnRow),
                const SizedBox(height: 24),
                const _Label('INVOICES'),
                const SizedBox(height: 10),
                if (_invoices.isEmpty)
                  const _Empty('No invoices yet.')
                else
                  ..._invoices.map(_invoiceRow),
                const SizedBox(height: 24),
              ]),
            ),
    );
  }

  Widget _txnRow(WalletTxn t) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: (t.isCredit ? Colors.green : AppColors.red).withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(t.isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                size: 15, color: t.isCredit ? Colors.green : AppColors.red),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_kindLabel(t.kind),
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
              Text(t.date, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
            ]),
          ),
          Text('${t.isCredit ? '+' : '-'}Rs.${t.amountRupees}',
              style: TextStyle(
                  color: t.isCredit ? Colors.green : AppColors.red,
                  fontSize: 14,
                  fontWeight: FontWeight.w900)),
        ]),
      );

  Widget _invoiceRow(Map<String, dynamic> inv) {
    final total = paiseToRupees((inv['total_paise'] ?? 0) as num);
    final status = (inv['status'] ?? 'paid').toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        const Icon(Icons.receipt_long_outlined, size: 18, color: AppColors.gold),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(_kindLabel((inv['kind'] ?? 'invoice').toString()),
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
            Text(formatDate(inv['created_at']?.toString()),
                style: const TextStyle(color: AppColors.muted, fontSize: 11)),
            if (inv['notes'] != null && inv['notes'].toString().isNotEmpty)
              Text(inv['notes'].toString(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.gold, fontSize: 10)),
          ]),
        ),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('Rs.$total',
              style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900)),
          Text(status.toUpperCase(),
              style: TextStyle(
                  color: status == 'paid' ? Colors.green : AppColors.gold,
                  fontSize: 9,
                  fontWeight: FontWeight.bold)),
        ]),
      ]),
    );
  }

  static String _kindLabel(String kind) => switch (kind) {
        'topup' => 'Wallet top-up',
        'bonus' => 'Promotional bonus',
        'spend' => 'Campaign spend',
        'refund' => 'Refund',
        'wallet_topup' => 'Wallet top-up',
        _ => kind,
      };
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold));
}

class _Empty extends StatelessWidget {
  final String text;
  const _Empty(this.text);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 18),
        child: Center(child: Text(text, style: const TextStyle(color: AppColors.muted, fontSize: 12))),
      );
}
