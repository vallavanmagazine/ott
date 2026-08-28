import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vallavan_app/app.dart';
import 'package:vallavan_app/widgets/bottom_nav.dart';

/// Advances past the splash hand-off.
///
/// Uses fixed pumps rather than [WidgetTester.pumpAndSettle]: the tabs show a
/// [CircularProgressIndicator] while their futures resolve, and an indicator is
/// a continuous animation, so pumpAndSettle would time out rather than settle.
Future<void> _bootToShell(WidgetTester tester) async {
  await tester.pumpWidget(const VallavanApp());
  await tester.pump(const Duration(seconds: 3)); // splash timer fires
  await tester.pump(); // navigation frame
  await tester.pump(const Duration(milliseconds: 100)); // tab futures resolve
}

void main() {
  setUp(() {
    // Without this every SharedPreferences call throws MissingPluginException,
    // leaving the profile tab stuck in its loading state forever.
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('splash shows the wordmark', (tester) async {
    await tester.pumpWidget(const VallavanApp());
    expect(find.text('VALLAVAN'), findsWidgets);

    // Letting the test end with the splash's 2100ms timer outstanding is what
    // made the original version of this test fail.
    await tester.pump(const Duration(seconds: 3));
    await tester.pump();
  });

  testWidgets('splash hands off to the three-tab shell', (tester) async {
    await _bootToShell(tester);

    expect(find.byType(VallavanBottomNav), findsOneWidget);

    expect(find.text('Search'), findsOneWidget);
    expect(find.text('Feed'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);

    // The removed tabs must not come back.
    expect(find.text('Explore'), findsNothing);
    expect(find.text('Inspire'), findsNothing);

    final nav = tester.widget<VallavanBottomNav>(find.byType(VallavanBottomNav));
    expect(nav.index, VallavanBottomNav.feedTab);
  });

  testWidgets('header exposes Live TV, Cast and notifications', (tester) async {
    await _bootToShell(tester);

    expect(find.byIcon(Icons.live_tv_rounded), findsOneWidget);
    expect(find.byIcon(Icons.cast_rounded), findsOneWidget);
    expect(find.byIcon(Icons.notifications_none_rounded), findsOneWidget);
  });
}
