# NEW UI INTEGRATION DISPATCH
# Merge the new webapp UI (from C:\vallavan_new\vallavannewapp\project)
# with the existing Supabase backend services.

## WHAT TO DO

The new UI is at: C:\vallavan_new\vallavannewapp\project
The existing backend-wired project is at: C:\vallavan_new\project

The new UI has better design but uses mockData only.
The existing project has Supabase services, auth, ads, etc.

MERGE STRATEGY:
1. Copy ALL new UI files (components, screens, App.tsx, assets) INTO 
   the existing project, REPLACING the old UI files
2. Keep ALL existing backend files:
   - src/lib/ (supabase.ts, transforms.ts, etc.)
   - src/services/ (all service files)
   - supabase/ (schema, seed, SQL files)
   - backend/ (NestJS)
   - playout/ 
   - seo-site/
   - .env, .env.example
   - .github/ (workflows)
   - All planning docs
3. Wire the NEW screens to use existing services (same pattern as before)

## FILES TO COPY FROM NEW UI → EXISTING PROJECT (replace)

src/App.tsx → replace (new 3-tab routing)
src/main.tsx → keep existing (has SW registration)
src/index.css → compare and merge (keep both styles)
src/components/ → replace ALL with new versions:
  BottomNav.tsx, Header.tsx, ContentCard.tsx, Logo.tsx,
  HeroBanner.tsx, ScreenShell.tsx, ui.tsx, AppLayout.tsx,
  AdSlot.tsx, SponsorLoginModal.tsx
src/screens/ → replace viewer screens with new versions:
  FeedScreen.tsx, LiveScreen.tsx, SearchScreen.tsx,
  ProfileScreen.tsx, SplashScreen.tsx,
  DocumentaryDetailScreen.tsx, VideoPlayerScreen.tsx,
  NotificationsScreen.tsx
src/screens/admin/ → keep existing (already wired)
src/screens/business/ → compare and use newer versions if they exist
src/data/mockData.ts → compare, keep existing (has more types)
src/hooks/useDevice.ts → use new version
src/context/AuthContext.tsx → keep existing (has real auth)
public/ → copy new assets:
  vallavan-favicon-512.png, icons/vallavanicon.png, 
  icons/vallavanicon.webp, icons/vallavanlogomobile.png

## WIRING NEW SCREENS TO BACKEND

Wire FeedScreen.tsx:
  Replace: import { feedReels, ads } from '@/data/mockData'
  With: import + useState + useEffect from src/services/feed.ts + ads.ts
  Keep the new UI layout exactly as-is

Wire SearchScreen.tsx:
  Replace mockData imports with service calls
  Search should filter from Supabase data

Wire LiveScreen.tsx:
  Replace mockData with live schedule from services
  Keep coming-soon mode (broadcast_config.channel_live flag)

Wire ProfileScreen.tsx:
  Keep new UI layout
  Wire sponsor/freelancer registration (phone OTP flow)
  Wire sponsor dashboard navigation
  Wire freelancer dashboard navigation
  Keep AI chatbot integration

Wire NotificationsScreen.tsx:
  Fetch from notifications service

Wire VideoPlayerScreen.tsx:
  Wire to play video_url from database
  Keep ad insertion (pre-roll, mid-roll)

Wire DocumentaryDetailScreen.tsx:
  Fetch documentary data from service

## KEEP EXISTING (do not replace)

- src/lib/ (entire folder)
- src/services/ (entire folder)  
- src/screens/admin/ (entire folder — already wired)
- supabase/ (entire folder)
- backend/ (entire folder)
- playout/ (entire folder)
- seo-site/ (entire folder)
- .env, .env.example
- .github/ (workflows)
- All .md planning docs
- package.json — MERGE dependencies (keep existing + add any new from new UI)
- tailwind.config.js — use new version (has updated theme)
- public/manifest.json — update with new icons
- public/sw.js — keep existing

## TABS LAYOUT

Bottom nav (mobile): Search | Feed (center logo) | Profile
Side rail (desktop): Search | Profile | Feed (bottom logo)
Header: Vallavan logo | Live TV | Cast | Notifications

NO Home tab, NO Explore tab, NO Inspire tab (hidden for now)

## CRITICAL: After merge

1. npm run typecheck — fix ALL errors
2. npm run build — must succeed
3. Verify all services still connect to Supabase
4. Verify admin panel still works at #admin
5. Verify sponsor/freelancer registration works
6. Commit to backend-integration-dev
7. Push

SAFETY: Only C:\vallavan_new\project. No SignBot. No main branch.
