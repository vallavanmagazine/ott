import 'package:flutter_test/flutter_test.dart';
import 'package:vallavan_app/app.dart';

void main() {
  testWidgets('App builds and shows splash', (WidgetTester tester) async {
    await tester.pumpWidget(const VallavanApp());
    // Splash shows the wordmark.
    expect(find.text('VALLAVAN'), findsWidgets);
  });
}
