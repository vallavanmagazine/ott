import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'screens/splash_screen.dart';

class VallavanApp extends StatelessWidget {
  const VallavanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vallavan',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: const SplashScreen(),
    );
  }
}
