import 'api_service.dart';

/// Razorpay payment links via the backend (test mode only). Mirrors web
/// `services/payments.ts`. Wallet-bonus math lives in PricingService.
class PaymentsService {
  /// Ask the backend to create a Razorpay payment link. Returns the short URL.
  static Future<String> createPaymentLink({
    required String sponsorId,
    required int amountRupees,
    String purpose = 'wallet_topup',
  }) async {
    final res = await Api.post('/api/payments/create-link', {
      'sponsorId': sponsorId,
      'amountRupees': amountRupees,
      'purpose': purpose,
    });
    return (res['shortUrl'] ?? '').toString();
  }

  /// WhatsApp/SMS/email share message for a payment URL.
  static String shareMessage(String url, int amountRupees) =>
      'Complete your Vallavan wallet top-up of ₹$amountRupees: $url';
}
