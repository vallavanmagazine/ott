import 'package:flutter_test/flutter_test.dart';
import 'package:vallavan_app/config/env.dart';
import 'package:vallavan_app/services/razorpay_service.dart';

/// Verifies the live-payment guard for whatever key this build was compiled
/// with. Run with the same --dart-define flags as the build under test:
///
///   flutter test --dart-define=RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
///   flutter test --dart-define=RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
///   flutter test --dart-define=RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx \
///                --dart-define=ALLOW_LIVE_PAYMENTS=true
void main() {
  test('checkout is refused whenever the guard is engaged', () async {
    final blocked = RazorpayService.unavailableReason != null;

    // A non-test key without the opt-out must always be blocked.
    if (Env.razorpayConfigured && !Env.razorpayIsTestKey && !Env.allowLivePayments) {
      expect(blocked, isTrue, reason: 'live key must be refused without opt-in');
      expect(RazorpayService.isBlocked, isTrue);
    }

    // A test key must never be blocked on live-key grounds.
    if (Env.razorpayIsTestKey) {
      expect(RazorpayService.isBlocked, isFalse);
      expect(RazorpayService.unavailableReason, isNull);
    }

    // When blocked, checkout must fail without opening the native sheet.
    if (blocked) {
      final r = await RazorpayService.checkout(amountRupees: 999, description: 'guard test');
      expect(r.ok, isFalse);
      expect(r.paymentId, isNull);
      expect(r.error, isNotNull);
    }
  });
}
