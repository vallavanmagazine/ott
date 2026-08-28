import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../widgets/bottom_nav.dart';
import '../widgets/vallavan_header.dart';
import 'feed_screen.dart';
import 'profile_screen.dart';
import 'search_screen.dart';

/// Three-tab shell: Search | Feed | Profile.
///
/// Tabs live in an [IndexedStack] so each keeps its scroll position and any
/// in-flight Supabase futures when the user switches away — important for the
/// feed, whose video controllers would otherwise be torn down and re-created.
class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = VallavanBottomNav.feedTab;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      body: Column(children: [
        const VallavanHeader(),
        Expanded(
          child: IndexedStack(index: _index, children: const [
            SearchScreen(),
            FeedScreen(),
            ProfileScreen(),
          ]),
        ),
      ]),
      bottomNavigationBar: VallavanBottomNav(
        index: _index,
        onTap: (i) => setState(() => _index = i),
      ),
    );
  }
}
