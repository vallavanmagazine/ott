# TASKS.md — Vallavan Backend Integration

Phased task list from the dispatch roadmap. `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked (see BLOCKERS.md).
Statuses mirrored into `PROJECT_STATE.md` as work lands.

## Phase 0 — Setup & Planning
- [x] Read dispatch brief + entire frontend codebase
- [x] Verify GitHub SSH access via `-vallavan` alias (auth + read confirmed)
- [x] Produce planning docs: CLAUDE, PRD, ARCHITECTURE, CURRENT_SPEC, TASKS, PROJECT_STATE, BLOCKERS
- [x] Draft Supabase/Prisma schema matching `mockData.ts`
- [x] `git init`, add remote, create `backend-integration-dev`, first commit, push, verify with `git ls-remote` (pushed `b0bf33d`; main untouched at `6ac9279`)

## Phase 1 — Core Backend + Frontend Data Layer
### Schema & data
- [ ] `supabase/schema.sql` — tables, enums, indexes, RLS
- [ ] `backend/prisma/schema.prisma` — mirror of schema
- [ ] `supabase/seed.sql` — reproduce all current mock records
- [ ] `.env.example` (frontend + backend)
### Frontend data layer (additive files only)
- [ ] `src/lib/supabase.ts`, `src/lib/format.ts`
- [ ] `src/services/content.ts` (documentaries, inspire)
- [ ] `src/services/ads.ts`, `feed.ts`, `live.ts`
- [ ] `loadInitialData()` preloader (runs behind splash)
- [x] Swap imports per screen — viewer (Home, Explore, Feed, Inspire, Live, Search, Detail, Player, Notifications; Profile n/a), typecheck green
- [x] Swap admin screens' read imports (all 8) + business (SponsorDashboard, MyCampaigns, CreativeLibrary); typecheck + build green
### Admin CMS writes
- [ ] NestJS scaffold (`backend/`) OR Supabase RLS-scoped writes (decision → PROJECT_STATE)
- [ ] Documentaries create/edit/publish
- [ ] Feed content create/edit/reorder/publish
- [ ] Live TV schedule create/edit
- [ ] Audit log write on each admin mutation
### Splash & PWA
- [ ] Build polished animated `SplashScreen` (1.8–2.2s, logo draw-in + tagline + accent sweep)
- [ ] Generate PWA icons (192/512/maskable/apple-touch), update `manifest.json`
- [ ] Service worker (app-shell + static cache + offline fallback), register in `main.tsx`
- [ ] Verify installability: mobile / tablet / desktop / Android TV
### Gate
- [ ] `typecheck` + `build` green, no locked-UI diffs, pushed & verified

## Phase 2 — Sponsor & Wallet System
- [ ] Sponsor auth (Supabase Auth) + SponsorLoginModal wired to real OTP/email
- [ ] Sponsor Dashboard / MyCampaigns / Analytics / Billing / GeoTargeting / CreativeLibrary data wiring
- [ ] Wallet: balance table, top-up via Razorpay (TEST mode only), per-post deduction (idempotent)
- [ ] Campaign lifecycle state machine: Draft → Pending → Active → Paused/Ended
- [ ] Admin Campaign Approvals workflow
- [!] Confirm per-post pricing formula (BLOCKERS)
- [!] Confirm dual-channel billing count (BLOCKERS)

## Phase 3 — Ad Serving & Geo-Targeting
- [ ] Ad placement engine: creative → slot mapping, geo scope, active-campaign gating
- [ ] Feed strip-ad / interstitial rotation logic (backed by real campaigns)
- [ ] Impression/click tracking

## Phase 4 — Social Publishing (setup-dependent)
- [!] Meta Business (FB Page + IG Business) verified for publishing (setup dep — BLOCKERS)
- [ ] Meta Graph API cross-post integration (build; publish gated by approval)
- [ ] Publish-confirmation tracking tied to wallet deduction

## Phase 5 — SEO/AEO/GEO Public Layer
- [!] Decision: build now vs defer (BLOCKERS)
- [ ] `seo-site/` Next.js SSR scaffold
- [ ] Per-documentary/category SSR pages (dynamic meta/OG)
- [ ] `VideoObject` JSON-LD per content item
- [ ] `LocalBusiness`/district GEO landing pages
- [ ] CMS-driven dynamic `sitemap.xml` + `robots.txt`
- [ ] Deep-link "Watch Now" into SPA

## Cross-cutting
- [x] `.env` provisioning for a real Supabase project (live DB confirmed)
- [ ] Service-layer shape tests vs mock snapshot
- [ ] Backend wallet/approval unit tests

---

## FINAL_AUTONOMOUS_DISPATCH — Phases 1–19 status (Sessions 3–4)

- [x] **Phase 1** Admin CRUD + audit logging (frontend live)
- [x] **Phase 2** Real Supabase Auth (admin role-gated + sponsor)
- [x] **Phase 3** Sponsor dashboard / campaign create / wallet billing
- [x] **Phase 4** Video playback (hls.js, code-split) + geo-detect + ad-engine + ad_events
- [x] **Phase 5** NestJS backend scaffold: wallet (Razorpay test) + campaigns lifecycle + wallet-api frontend *(server app not installed/run)*
- [x] **Phase 6** Broadcast overlay — 11 components + Realtime (frontend live)
- [x] **Phase 7** News feed system (feed_reel + ticker in one action)
- [x] **Phase 8** Ad timers — `ad_insert_points` table + engine hooks
- [x] **Phase 9** Schedule engine (client helper: now/next/progress)
- [x] **Phase 10** Playout service scaffold (FFmpeg/HLS, RSS, upload, Docker) *(not started)*
- [x] **Phase 11** LiveScreen broadcast experience (overlay integrated)
- [x] **Phase 12** Admin dashboards — Broadcast Control + API Settings
- [x] **Phase 13** SEO site scaffold (Next.js SSR, VideoObject JSON-LD, sitemap/robots) *(not installed/built)*
- [x] **Phase 14** Social publishing — Meta **stub only**
- [x] **Phase 15** Fast2SMS OTP (backend) *(server-side)*
- [x] **Phase 16** Resend email service (backend)
- [x] **Phase 17** WhatsApp notification service (backend)
- [x] **Phase 18** Firebase push service (backend)
- [x] **Phase 19** AI Studio — Anthropic ad-creative (frontend + backend)

Frontend: `typecheck` + `build` green (1721 modules, 524 kB main + 525 kB lazy hls).
Server apps (`backend/`, `playout/`, `seo-site/`) are coherent scaffolds with READMEs; run steps documented, none deployed (build-only mandate).
