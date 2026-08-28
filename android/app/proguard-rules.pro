# Razorpay checkout SDK — reflection-driven, so R8 must not rename these.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.razorpay.** { *; }
-dontwarn com.razorpay.**
-optimizations !method/inlining/*
-keepclasseswithmembers class * {
  public void onPayment*(...);
}
