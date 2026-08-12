# PROJECT_STATE.md — Running Log

Newest first. Records where things stand, decisions taken, and why. Read after `CLAUDE.md` to catch up.

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
