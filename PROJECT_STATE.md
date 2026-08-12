# PROJECT_STATE.md — Running Log

Newest first. Records where things stand, decisions taken, and why. Read after `CLAUDE.md` to catch up.

---

## 2026-08-12 — Session 4: Phases 5–19 (autonomous, one execution)

Frontend stays green throughout: **1721 modules, 524 kB main + 525 kB lazy hls chunk.** `backend/`, `playout/`, `seo-site/` are separate apps excluded from the frontend build (own package.json/tsconfig) — scaffolded, coherent, **not installed/built/deployed** in this session.

### Cross-cutting security decision (important)
Integration secrets (Anthropic, Razorpay secret, Resend, Fast2SMS, WhatsApp, Firebase) are **server-side only**. Two sources: `backend/.env` and the `platform_settings` table (set from the admin **API Settings** page). `platform_settings` has **no client SELECT policy** — values never reach any browser; the admin UI only learns *which* keys are set via `configured_setting_keys()`. NestJS reads values with the service-role key. **Never `VITE_`-prefixed** (that would bundle into the client). Only public values are `VITE_` (Razorpay key_id delivered by backend, `VITE_API_BASE_URL`).

### Phase 5 — Wallet + NestJS backend (scaffold)
`backend/` NestJS app: `common` (service-role Supabase + SettingsService with DB→env fallback), `wallet` (Razorpay **test-mode only**, refuses non-`rzp_test_` keys; order/verify HMAC/balance/idempotent per-post deduction from `pricing_config`), `campaigns` (lifecycle). Frontend `wallet-api.ts` + BillingScreen Top-Up placeholder.

### Phase 6 + 11 — Broadcast overlay (DONE, frontend live)
11 components + BroadcastOverlay driven by `broadcast_config` + `ticker_items` via Realtime; integrated into LiveScreen. Weather via Open-Meteo (no key). See Session-3-style notes above.

### Phase 7 — News feed system (DONE)
`news-feed.ts createNewsItem` → one action writes a `feed_reels` (News, 60-char title) + a `ticker_items` (200-char, 24h). Admin "Quick News Post" in Broadcast Control.

### Phase 8 — Ad timers
`ad_insert_points` table (in rls_and_tables.sql) for per-program pre/mid/post-roll. Playout `ad-inserter` + browser player use them. Admin timeline editing is minimal (deferred polish).

### Phase 9 — Schedule engine (DONE, client helper)
`schedule-engine.ts`: current/next program + progress from `live_slots` (drives lower-third + fallback playback). Authoritative adjustment lives in playout.

### Phase 10 — Playout service (scaffold)
`playout/` standalone Node+FFmpeg app + Dockerfile: scheduler → HLS, playlist-builder, ffmpeg-engine, ad-inserter, schedule-adjuster, filler, health-check, rss-fetcher (15-min ticker auto-fill), upload-server (admin video upload → `/data/videos`). **Not started** (needs FFmpeg + server).

### Phase 12 — Admin dashboards (DONE)
Broadcast Control Panel + API Settings pages, wired into AdminApp nav.

### Phase 13 — SEO site (scaffold)
`seo-site/` Next.js App Router: landing, `documentaries/[id]` (dynamic meta/OG + **VideoObject JSON-LD** + Watch-Now deep link), `genre/[genre]`, dynamic `sitemap.xml`, `robots.txt`. **Not installed/built** (would pull full Next toolchain).

### Phase 14 — Social publishing (stub only)
`backend/social`: Meta publish logs `[STUB] Would publish…`, returns `{success:false}`. No live calls (BLOCKERS B5).

### Phases 15–18 — Messaging (scaffold, server-side)
`backend/messaging`: **15** Fast2SMS OTP (`/api/otp/send|verify`, codes hashed in `otp_verifications`), **16** Resend email (welcome/approval/receipt), **17** WhatsApp Cloud API, **18** Firebase FCM push. Each reads its key from settings; logs `[skip]` when unset.

### Phase 19 — AI Studio (DONE frontend + backend)
`backend/ai` Anthropic (`claude-sonnet-5`) `/api/ai/ad-creative`; AIStudioScreen calls it (template fallback when backend/key absent). Key server-side only.

### Judgment calls logged
- Used hls.js (not Video.js) — Phase 4 decision, code-split.
- Admin CRUD/sponsor writes via direct Supabase + RLS `is_admin()`/ownership (not world-writable).
- Server scaffolds (backend/playout/seo) intentionally not installed/run — build-only mandate + heavy toolchains; each has a README with run steps.
- Meta = stub; Razorpay = test-mode-enforced in code.

---

## 2026-08-12 — Session 3: FINAL_AUTONOMOUS_DISPATCH (14 phases)

Executing the 14-phase dispatch (`C:\vallavan_new\FINAL_AUTONOMOUS_DISPATCH.md`). `.env` is now populated → app reads live Supabase. Verified live DB matches reconciled services exactly (documentaries, live_slots start_time24/duration_min, ads sponsor/bg_image, app_users, ad_placements). `app_users`/`campaigns`/`sponsors`/`audit_logs` are empty.

### SQL handed to user — `supabase/rls_and_tables.sql`
Write RLS (gated on `is_admin()` / sponsor ownership — NOT world-writable, because the anon key is public), new tables (broadcast_config, ticker_items, rss_feeds, ad_insert_points), schema adds (campaigns.target_districts, documentaries/live_slots.video_url, live_slots.break_after_sec), and seed of admin/sponsor app_users rows. User runs this in Supabase SQL Editor.

### Phase 1 — Admin writes (DONE, build green 491 kB)
- `src/services/admin-writes.ts`: full CRUD + audit logging for documentaries, feed_reels, live_slots, inspire_items; user suspend/activate; campaign approve/reject; ad-placement pause/resume. Every mutation appends an `audit_logs` row. Guarded (throws if supabase null).
- Wired admin screens (admin UI edits allowed per dispatch rule 6/7):
  - AdminCampaignApprovals → Approve/Reject
  - AdminUsers → Suspend/Activate toggle
  - AdminAdManagement → Pause/Resume (+ status-aware badge, new Action column)
  - AdminDocumentaries → Delete, Publish/Unpublish, Add (wired modal → createDocumentary Draft)
  - AdminFeedContent → real Delete + Add (UploadModal → createFeedReel)
  - AdminLiveTV → Delete + Add-slot modal
- Writes take effect once an admin is authenticated (Phase 2) and RLS SQL is applied.
- **Decision:** admin CRUD via direct Supabase client (per dispatch); security via `is_admin()` RLS rather than world-writable policies (anon key is public).

### Phase 2 — Real Supabase Auth (DONE, build green 492 kB)
- `src/context/AuthContext.tsx` rewritten: `signInWithPassword`, role fetched from `app_users` by email, `getSession()` + `onAuthStateChange` for persistence. Interface preserved (isLoggedIn/isSponsor/name/email/login/logout) and extended (`isAdmin`, `role`, `loading`). `login` is now `(email, password) => Promise<{ok,error?,role?}>`.
- `AdminLogin.tsx` → real auth, **admin-role-gated** (non-admin is rejected + signed out), error display.
- `AdminApp.tsx` → shows panel when `auth.isAdmin` (session persistence); header shows real email.
- `SponsorLoginModal.tsx` → email+password Supabase sign-in (OTP flow removed; OTP returns in Phase 15).
- Requires the two auth users (admin@vallavan.in / ads@tamiltea.in) — user created them.

### Phase 3 — Sponsor flows (DONE, build green 494 kB)
- `src/services/sponsor.ts`: `getCurrentSponsorId()` (owner_id then email), `fetchMyCampaigns`, `createCampaign`/`submitCampaign`/`pause`/`resume`, `createAd`, `fetchWallet`. Money paise↔rupees at the boundary; audit-logged.
- SponsorDashboard + MyCampaigns → per-sponsor campaigns (dynamic counts, CTR divide-by-zero guard).
- CreateCampaign → final step inserts a real `Pending Approval` campaign with target_districts + budget.
- BillingScreen → real wallet balance + transactions; Top Up is a Phase-5 placeholder.
- Graceful when no sponsor row / empty tables (shows zero state). GeoTargeting/CreativeLibrary/CampaignAnalytics remain as-is (pickers/charts) — deeper wiring deferred.

### Phase 4 — Video playback + geo + ad engine (DONE, build green; main 497 kB, hls.js lazy 525 kB chunk)
- **Decision:** used `hls.js` + native `<video>` + YouTube iframe instead of Video.js (lighter, TS-clean). hls.js is **code-split** (dynamic import) so it only loads when an HLS stream actually plays — main bundle stayed ~497 kB.
- `src/lib/video-player.ts`: `detectVideoKind`, `youtubeEmbedUrl`, `attachVideo` (lazy hls).
- `src/lib/geo-detect.ts`: `detectDistrict()` via ip-api.com → nearest TN district, localStorage cache, 'Chennai' default.
- `src/services/ad-engine.ts`: `getAdsForDistrict` (active campaigns targeting district → ads, graceful fallback), `getVideoAdForViewer`/`getOverlayAdForViewer`, `trackImpression`/`trackClick` → `ad_events`.
- `Documentary` interface gains `videoUrl?` (additive); documentaries service maps `video_url`.
- VideoPlayerScreen (Phase 4 authorizes editing this viewer screen): renders real `<video>`/YouTube iframe when `videoUrl` present, else the poster fallback; play/pause drives the element; pre-roll impression tracked with detected district. Ad overlays preserved.
- Added `ad_events` table + public-insert RLS to `supabase/rls_and_tables.sql` (**re-run that appended section**).
- No video URLs seeded yet → players fall back to poster until admin sets `video_url` on documentaries/live_slots.

### Phase 15 (future, logged per user request) — OTP + transactional email
- **Fast2SMS** for OTP (sponsor/viewer phone login) and **Resend** for transactional emails (campaign approvals, receipts, notifications). Not built yet; Supabase built-in email auth used for now. Revisit after Phase 14.

### Deploy status
Per dispatch rule 5, NOT deploying to VPS this session (build only). Supersedes the earlier SSH deploy attempt.

---

## 2026-08-12 — Session 2: Wire screens to services

### Done
- Wired **all 20 data-consuming screens** to `src/services/*` using the pattern: keep mock import (aliased `mock*`) as `useState` seed + `useEffect` calling `fetchX()`. Zero JSX/structural changes.
  - Viewer (9): Home, Explore, Live, Inspire, Search, Notifications, DocumentaryDetail, VideoPlayer, Feed.
  - Admin (8): AdManagement, AuditLogs, CampaignApprovals, Documentaries, FeedContent, LiveTV, Sponsors, Users.
  - Business (3): SponsorDashboard, MyCampaigns, CreativeLibrary.
- `FeedScreen.buildFeedSequence()` parametrized to take `(reels, ads)` (was reading module-scope mock) — data-layer only; rebuilt in `useEffect` after fetch.
- `npm run typecheck` green after each group; `npm run build` green (1696 modules).
- Committed in 3 groups (`1b34eef` viewer, `a2eadcf` admin, `4189e42` business).

### Not swapped (intentional — no service / static)
- ProfileScreen (`userProfile` is a single static object; viewers stay local per B3).
- CreateCampaign / GeoTargeting (`tamilNaduDistricts` static list).
- `pexelsUrl`, `genreColors`, `genres`, `inspireCategories`, `recentSearches`, `trendingSearches` — static helpers/config, kept in place per CURRENT_SPEC.

### ✅ RESOLVED (Session 2b) — services reconciled to `supabase/schema.sql`
Schema is source of truth. All service queries/mappers now use the real table & column names. `typecheck` + `build` green; supabase still null so fallback behavior unchanged.
- `ads.ts` → table `ad_contents`→`ads`; `sponsor_name`→`sponsor`; removed non-existent `.eq('status','Live')` filter (ads table has no status).
- `documentaries.ts` → `cast_members`→`cast`.
- `live.ts` → `time_display`/`time_24`/`duration_display` dropped; now derives `time` via `format12Hour(start_time24)` and `duration` via `formatMinutes(duration_min)` (new transforms).
- `feed.ts` → `uploaded_at`→`created_at`; `attached_campaign` (UUID FK) now resolved to campaign **name** via `select('*, campaign:campaigns(name)')` to match mock shape.
- `admin.ts` → table `users`→`app_users`, `joined_at`→`created_at`; audit `user_email`→`actor`; `ad_placements.sponsor_name`→`sponsor`; pending-campaign `budget` paise→rupees (÷100); sponsors campaign-count & spend now computed from a `campaigns(spend_paise)` join instead of 0 placeholders.
- `campaigns.ts` → `spend` paise→rupees (÷100) to match mock's rupee integer.
- `transforms.ts` → added `format12Hour()` and `formatMinutes()`.
- `inspire.ts`, `notifications.ts` → already matched schema; no change.

### Verify
- Pushed to `backend-integration-dev`; `git ls-remote` re-confirmed. `main` still untouched.

---

## 2026-08-12 — Session 1: Planning + schema + repo setup

### Status snapshot
- **Phase:** 0 → starting 1.
- **Frontend:** untouched (as required). Fully read & understood.
- **Backend:** schema drafted; no NestJS scaffold yet; no Supabase project provisioned.
- **Repo:** being initialized on `backend-integration-dev`.

### Done
- Read the full dispatch (`VALLAVAN_BACKEND_INTEGRATION_SEO_DISPATCH.md`) and the entire frontend: all of `src/components`, `src/screens` (viewer + admin + business), `src/context`, `src/hooks`, `src/data/mockData.ts`, config, `index.html`, `manifest.json`.
- Verified GitHub access: SSH alias `github.com-vallavan` authenticates as `vallavanmagazine`; `ott.git` readable; `main` exists at `6ac9279`. **Write access to be confirmed by first push.**
- Wrote planning docs: `CLAUDE.md`, `PRD.md`, `ARCHITECTURE.md`, `CURRENT_SPEC.md`, `TASKS.md`, `BLOCKERS.md`, this file.
- Drafted schema: `supabase/schema.sql` + `backend/prisma/schema.prisma`, field-for-field from `mockData.ts`.

### Key decisions (and why)
1. **Money as integer paise everywhere.** Avoids float drift on wallet/spend; converted to rupees only at the display boundary in services. (`campaigns.spend_paise`, `budget_paise`, wallet amounts.)
2. **Display strings are derived, not stored.** `duration "24:18"`, `uploaded "Aug 10, 2024"`, `time "06:00 PM"`, `joined "Jan 2024"` are computed in the service layer from `duration_sec` / timestamps. Keeps the DB clean while returning byte-identical mock shapes.
3. **UUID primary keys.** They're strings, so they satisfy the mock `id: string` interface directly; no separate slug needed yet.
4. **`adminDocumentaries`, `adminSponsors`, `adminPendingCampaigns` are projections**, not separate tables — derived from `documentaries` / `sponsors` / `campaigns` in the service layer. One source of truth.
5. **`feed_reels.attached_campaign` stored as FK**, though the mock uses a campaign *name* string. Service resolves name↔id at the boundary. FK added via deferred `ALTER` to resolve table-ordering.
6. **RLS: public read on published content only; no anon writes.** Mutations go through NestJS service role (Phase 1 admin writes) — see decision #7. Sponsor-scoped read policies stubbed for when sponsor auth lands.
7. **Admin write path (B8): minimal NestJS now.** NestJS is needed for Phase 2 wallet logic regardless, so we scaffold it now and route Phase-1 admin content writes through it rather than hand-crafting temporary RLS write policies we'd tear out. Confirmed default; revisit if it slows Phase 1.
8. **Viewer identity stays local (B3 default).** No `viewer_profiles` table in Phase 1; Watch History / Watch Later remain client-side. Schema leaves room to add later.
9. **Splash doubles as the data-preload window.** `loadInitialData()` fires while the splash animates so Home paints warm and top-level synchronous data reads stay valid without touching screen JSX.

### Repo (done this session)
- `git init` on `backend-integration-dev`, based on `origin/main` (which held only `README.md`) so history is connected for a future PR.
- First commit `b0bf33d` (planning docs + schema + Bolt frontend as-is) pushed. **Write access confirmed.**
- `git ls-remote` verified: `refs/heads/backend-integration-dev` → `b0bf33d`; `refs/heads/main` untouched → `6ac9279`.

### Not done / next
- Phase 1 implementation: `seed.sql`, `src/lib` + `src/services` + data hooks, import swaps, NestJS scaffold, splash build, PWA.
- **Need from human to run against live data:** a Supabase project URL + anon key + service-role key + DB connection string (B4), or approval to run local Supabase via Docker.

### Open blockers (see BLOCKERS.md)
B1 pricing formula · B2 dual-channel billing · B3 viewer accounts (default chosen) · B4 Supabase project provisioning · B5 Meta readiness · B6 Razorpay + live-charge approval · B7 SEO timing · B8 admin write path (default chosen). None block Phase 1 code; B4 blocks *running* against live data.

### Notes for the human
- Nothing deployed, no live charges, no Meta calls, no push to main — all four hard boundaries respected.
- To run against real data I need a Supabase project's URL + keys (B4), or your OK to run a local Supabase (Docker) instance.
