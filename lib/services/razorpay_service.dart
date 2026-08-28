import 'dart:async';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../config/env.dart';

/// Outcome of a single checkout attempt.
class PaymentResult {
  final bool ok;
  final String? paymentId;
  final String? error;
  const PaymentResult.success(this.paymentId)
      : ok = true,
        error = null;
  const PaymentResult.failure(this.error)
      : ok = false,
        paymentId = null;
}

/// Wraps `razorpay_flutter` in a Future-returning API.
///
/// The plugin is callback-based and holds native resources, so each checkout
/// gets its own instance which is cleared as soon as the first callback fires.
/// The [Completer] guard matters: Razorpay can emit more than one event for a
/// single attempt (e.g. external-wallet followed by error), and completing a
/// Completer twice throws.
class RazorpayService {
  static bool get isConfigured => Env.razorpayConfigured;

  static Future<PaymentResult> checkout({
    required int amountRupees,
    required String description,
    String? contact,
    String? email,
    String name = 'Vallavan Media',
  }) {
    if (!isConfigured) {
      return Future.value(
        const PaymentResult.failure('Payments are not configured for this build (RAZORPAY_KEY_ID missing).'),
      );
    }

    final completer = Completer<PaymentResult>();
    final razorpay = Razorpay();

    void finish(PaymentResult r) {
      razorpay.clear();
      if (!completer.isCompleted) completer.complete(r);
    }

    razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse res) {
      finish(PaymentResult.success(res.paymentId));
    });
    razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse res) {
      finish(PaymentResult.failure(_message(res)));
    });
    razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse res) {
      finish(PaymentResult.failure(
        'Payment moved to ${res.walletName ?? 'an external wallet'}. '
        'Your wallet will be credited once it completes.',
      ));
    });

    try {
      razorpay.open({
        'key': Env.razorpayKeyId,
        // Razorpay takes the smallest currency unit.
        'amount': amountRupees * 100,
        'currency': 'INR',
        'name': name,
        'description': description,
        'timeout': 300,
        'prefill': {
          if (contact != null && contact.isNotEmpty) 'contact': contact,
          if (email != null && email.isNotEmpty) 'email': email,
        },
        'theme': {'color': '#D32F2F'},
      });
    } catch (e) {
      finish(PaymentResult.failure(e.toString()));
    }

    return completer.future;
  }

  static String _message(PaymentFailureResponse res) {
    final m = res.message;
    if (m == null || m.isEmpty) return 'Payment failed. Please try again.';
    // Razorpay sometimes returns the raw JSON error envelope.
    return m.length > 180 ? 'Payment failed. Please try again.' : m;
  }
}
