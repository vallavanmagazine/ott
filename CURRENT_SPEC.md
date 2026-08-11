# CURRENT_SPEC.md — Active Work Contract

The precise spec for what is being built **right now** (Phase 1) and the constraints that bind all phases. Update the "Active phase" section as work advances; keep the locked constraint forever.

## 🔒 LOCKED CONSTRAINT (applies to every phase — non-negotiable)

**No file under `src/components/`, `src/screens/`, `src/context/`, or `src/hooks/` may be modified except to swap a data-source import.**

- Permitted edit to a locked file: changing an `import { … } from '@/data/mockData'` line to import the same-named, same-shaped value from a new service/hook/data module. Nothing else on the line's surrounding code.
- The returned data MUST satisfy the exact TypeScript interface already declared in `mockData.ts` (`Documentary`, `InspireItem`, `LiveSlot`, `AdContent`, `FeedReel`, and the admin/campaign array shapes) — same field names, same types, including display-formatted strings.
- New files (services, hooks, lib, splash internals) are unrestricted.
- `src/hooks/useDevice.ts` is **locked** (existing UI hook). New hooks live alongside it but do not alter it.
- If real data cannot match a shape, fix the **service/mapper**, never the component.

Any diff touching locked UI structure/JSX/props/classes is a spec violation and must be reverted.

## Hard boundaries (human-approval gates)

No deploy · no live Razorpay charge · no Meta publish · no push to `main`/`master`. These four are never done autonomously.

## Active phase — Phase 1: Core Backend + Frontend Data Layer

**Goal:** stand up the Supabase schema, seed it with the current mock content, wire the viewer app + Admin CMS reads to live data, and land the splash + PWA polish — all with zero UI-structure change.

### In scope now
1. **Schema** — `supabase/schema.sql` + `backend/prisma/schema.prisma`, field-for-field from `mockData.ts`. Enums for `Genre`, feed type, statuses, roles. Money as integer paise. RLS policies (public read on published; writes denied to anon).
2. **Seed** — `supabase/seed.sql` reproducing every current mock record (12 documentaries, 8 inspire, 6 live slots, 4 ads, 10 feed reels, 36 districts, 4 campaigns, admin arrays, notifications) so the app looks identical on first run.
3. **Frontend data layer** — `src/lib/supabase.ts`, `src/lib/format.ts`, `src/services/*`, new `src/hooks/use*.ts`. A `loadInitialData()` preloader that runs behind the splash so top-level synchronous data reads stay valid (see ARCHITECTURE §4).
4. **Swap imports** — per screen, replace mock imports with live-data equivalents. One screen at a time, `typecheck` after each, logged in `PROJECT_STATE.md`.
5. **Admin CMS writes** — documentaries, feed content, live TV create/edit/publish (via NestJS or Supabase RLS-scoped, decision logged). Enough to prove admin→viewer flow.
6. **Splash screen** — polished animated build (logo draw-in/scale + tagline reveal + accent sweep, 1.8–2.2s), transitions to Home via existing `onDone`.
7. **PWA** — manifest icons (multi-size + maskable), service worker + registration, offline shell, installability verified on mobile/tablet/desktop/TV.

### Explicitly NOT in scope this phase
- Wallet/Razorpay logic (Phase 2), ad-serving engine (Phase 3), Meta publishing (Phase 4), SEO SSR site (Phase 5).
- Any real video pipeline.
- Provisioning a live Supabase project or deploying anything (needs approval / setup deps — see BLOCKERS).

### Definition of done (Phase 1)
- [ ] `schema.sql` + `schema.prisma` reviewed, match every `mockData.ts` field.
- [ ] `seed.sql` reproduces all current mock records.
- [ ] Viewer screens render from the data layer with byte-identical output vs mock (Home, Explore, Feed, Inspire, Live, Search, Detail, Player, Notifications, Profile).
- [ ] Admin CMS can create/edit/publish documentaries, feed reels, live slots; changes appear in viewer app.
- [ ] Splash animation meets quality bar and transitions cleanly.
- [ ] PWA installable on all four device classes; offline shell loads.
- [ ] `npm run typecheck` and `npm run build` pass; no locked-UI diffs.
- [ ] All committed to `backend-integration-dev` and pushed; `git ls-remote` confirms.

## Interface inventory (what services must return)

From `mockData.ts` — services/hooks must produce these exact exports' shapes:

- `documentaries: Documentary[]`, `inspireItems: InspireItem[]`, `liveSchedule: LiveSlot[]`, `ads: AdContent[]`, `feedReels: FeedReel[]`
- `genres: Genre[]`, `genreColors`, `inspireCategories`, `tamilNaduDistricts: string[]`
- `campaigns[]`, `notifications[]`, `userProfile`, `trendingSearches[]`, `recentSearches[]`
- Admin: `adminUsers[]`, `adminDocumentaries[]`, `adminSponsors[]`, `adminPendingCampaigns[]`, `adminAdPlacements[]`, `adminAuditLogs[]`
- Helpers `pexelsUrl()` and `genreColors` are pure/static — kept in place (not backend-derived) unless a reason arises.

## Change log for this spec
- 2026-08-12 — Phase 1 spec drafted from dispatch. Locked constraint recorded.
