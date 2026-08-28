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

  /// Set when the build carries a key that would charge real money without
  /// having opted in via `--dart-define=ALLOW_LIVE_PAYMENTS=true`.
  static bool get isBlocked => Env.livePaymentsBlocked;

  /// Why checkout is unavailable, or null when it is ready to run. Exposed so
  /// screens can explain the state up front instead of only on tap.
  static String? get unavailableReason {
    if (isBlocked) {
      return 'This build carries a live Razorpay key, which would charge real '
          'money. Rebuild with a test key (rzp_test_...), or with '
          '--dart-define=ALLOW_LIVE_PAYMENTS=true to take real payments.';
    }
    if (!isConfigured) {
      return 'Payments are not configured for this build (RAZORPAY_KEY_ID missing).';
    }
    return null;
  }

  static Future<PaymentResult> checkout({
    required int amountRupees,
    required String description,
    String? contact,
    String? email,
    String name = 'Vallavan Media',
  }) {
    // Refuse before the sheet opens — never let a live key reach Razorpay in a
    // build that has not opted in.
    final blocked = unavailableReason;
    if (blocked != null) return Future.value(PaymentResult.failure(blocked));

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
