# TASKS.md — Vallavan Backend Integration

Phased task list from the dispatch roadmap. `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked (see BLOCKERS.md).
Statuses mirrored into `PROJECT_STATE.md` as work lands.

## Phase 0 — Setup & Planning
- [x] Read dispatch brief + entire frontend codebase
- [x] Verify GitHub SSH access via `-vallavan` alias (auth + read confirmed)
- [x] Produce planning docs: CLAUDE, PRD, ARCHITECTURE, CURRENT_SPEC, TASKS, PROJECT_STATE, BLOCKERS
- [x] Draft Supabase/Prisma schema matching `mockData.ts`
- [~] `git init`, add remote, create `backend-integration-dev`, first commit, push, verify with `git ls-remote`

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
- [ ] Swap imports per screen (Home → Explore → Feed → Inspire → Live → Search → Detail → Player → Notifications → Profile), typecheck after each
- [ ] Swap admin screens' read imports
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
- [ ] `.env` provisioning for a real Supabase project (setup dep — BLOCKERS)
- [ ] Service-layer shape tests vs mock snapshot
- [ ] Backend wallet/approval unit tests
