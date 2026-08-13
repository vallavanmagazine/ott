import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../widgets/vallavan_logo.dart';
import 'main_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  late final Animation<double> _fade;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));
    _fade = CurvedAnimation(parent: _c, curve: Curves.easeIn);
    _scale = Tween(begin: 0.7, end: 1.0).animate(CurvedAnimation(parent: _c, curve: Curves.easeOutBack));
    _c.forward();
    Future.delayed(const Duration(milliseconds: 2100), () {
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MainShell()));
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      body: Center(
        child: FadeTransition(
          opacity: _fade,
          child: ScaleTransition(
            scale: _scale,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const VallavanLogo(size: 88),
              const SizedBox(height: 20),
              const Text('VALLAVAN', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 4, color: Colors.white)),
              const SizedBox(height: 6),
              const Text('DOCUMENTARIES THAT MATTER', style: TextStyle(fontSize: 10, letterSpacing: 3, color: AppColors.muted, fontWeight: FontWeight.w500)),
              const SizedBox(height: 28),
              Container(width: 32, height: 2, decoration: BoxDecoration(color: AppColors.red, borderRadius: BorderRadius.circular(2))),
            ]),
          ),
        ),
      ),
    );
  }
}
