# ARCHITECTURE.md — Vallavan OTT Platform

How the system is built. Pairs with `PRD.md` (what) and `CURRENT_SPEC.md` (this phase's contract).

## 1. High-level topology

```
                 ┌─────────────────────────────────────────────┐
                 │                Supabase                      │
                 │  Postgres · Auth · Storage · RLS             │
                 └───────▲───────────────▲──────────────▲───────┘
                         │ direct reads  │ auth         │ service-role
           (published    │ (anon key)    │              │ writes
            content)     │               │              │
   ┌─────────────────────┴───┐   ┌───────┴────────┐  ┌──┴──────────────────┐
   │  Vite React SPA         │   │  Sponsor /     │  │  NestJS + Prisma API │
   │  (viewers/sponsors/admin)│  │  Admin login   │  │  (business logic)    │
   │  @supabase/supabase-js  │   └────────────────┘  │  wallet · approvals  │
   │  src/services/*         │──────────────────────▶│  admin mutations     │
   └─────────────────────────┘   writes / money      │  Razorpay · Meta     │
                                                      └──────────┬───────────┘
                                                                 │
                                              ┌──────────────────┴─────────────┐
                                              │ Razorpay (top-ups)  Meta Graph  │
                                              └────────────────────────────────┘

   ┌──────────────────────────────────────────┐
   │  seo-site/ (Next.js SSR) — Phase 5        │  reads Supabase → crawlable pages,
   │  VideoObject JSON-LD · sitemap · OG        │  deep-links into the SPA
   └──────────────────────────────────────────┘
```

## 2. Why this split (read/write boundary)

The dispatch mandates: **frontend reads go direct to Supabase for speed; writes and anything sensitive go through NestJS.**

- **Direct Supabase reads (anon key + RLS)**: documentaries, inspire items, live schedule, feed reels, published ad creatives, districts, genres. These are public, published, read-only for the viewer app. Fast, no server hop.
- **NestJS API (service-role key, never exposed to client)**: wallet balance deduction, campaign approval workflow, per-post billing, admin-only mutations, Razorpay order/verify, Meta publishing. Anything where the client cannot be trusted with the logic or the keys.

Rationale: the Supabase anon key is public by design; RLS makes direct reads safe. But wallet math and approval state must never be client-authoritative — hence the NestJS layer holding the service-role key.

## 3. Data layer

### 3.1 Source of truth
`src/data/mockData.ts` TypeScript interfaces are the canonical shapes. The Postgres schema (`supabase/schema.sql`) and Prisma schema (`backend/prisma/schema.prisma`) are derived field-for-field so the API returns objects that satisfy those interfaces with **zero UI change**.

### 3.2 Shape-preservation strategy
Some mock fields are display strings derived from richer real data. The **service layer** does the mapping so the interface stays byte-identical:

| Mock field | Real storage | Service maps to |
|---|---|---|
| `duration: "24:18"` | `duration_sec int` | formats `mm:ss` |
| `durationSec: 1458` | `duration_sec int` | passthrough |
| `uploaded: "Aug 10, 2024"` | `created_at timestamptz` | formats `MMM DD, YYYY` |
| `year: 2024` | `year int` (or from `released_at`) | passthrough |
| `poster / backdrop / thumb` | Storage public URL or Pexels id | passthrough (the `pexelsUrl()` helper already tolerates both full URLs and ids) |
| `spend: 18500`, wallet amounts | `paise bigint` | ÷100 for display where the mock shows rupees; keep integer where mock shows integer |
| `id: "d1"` | `uuid` PK | UUID is a string — satisfies `id: string` |

Money is stored as integer **paise** everywhere to avoid float drift; converted only at the display boundary.

### 3.3 Enums
`Genre` (13 values) becomes a Postgres enum `genre_type`. `FeedContentType`, campaign status, feed status, user role/status likewise become enums or CHECK constraints matching the exact string literals the UI compares against.

### 3.4 Security (RLS)
- `select` allowed to `anon` only where `status = 'Published'` (content tables).
- All `insert/update/delete` denied to `anon`/`authenticated` at the table level; performed by NestJS via service role, or by narrowly-scoped policies for sponsor-owned rows.
- Sponsor tables (`campaigns`, `wallets`, `creatives`) scoped by `owner_id = auth.uid()` for reads a sponsor makes of their own data.
- Admin actions run through NestJS with a verified admin JWT; every mutation writes an `audit_logs` row.

## 4. Frontend integration pattern (locked-UI-safe)

New, additive files only:

```
src/lib/supabase.ts          # createClient(env.url, env.anonKey)
src/lib/format.ts            # mm:ss, MMM DD YYYY, count formatting (mirrors existing inline helpers)
src/services/content.ts      # getDocumentaries(): Promise<Documentary[]>  etc.
src/services/ads.ts          # getAds(): Promise<AdContent[]>
src/services/feed.ts         # getFeedReels(): Promise<FeedReel[]>
src/services/live.ts         # getLiveSchedule(): Promise<LiveSlot[]>
src/services/admin.ts        # admin CRUD via NestJS
src/services/sponsor.ts      # campaigns, wallet via NestJS
src/hooks/useDocumentaries.ts, useFeedReels.ts, ...   # thin data hooks
```

**How the swap works without touching UI:** each screen currently does `import { documentaries } from '@/data/mockData'` and uses it synchronously. Two viable swap patterns, chosen per-screen to avoid JSX changes:

- **Preferred — module-level data adapter:** keep a `src/data/*` module that re-exports the same names but hydrated from Supabase at bootstrap (a `loadInitialData()` called before first paint / behind the splash), so screens keep importing the same symbols. Where a screen reads a top-level `const documentaries`, we provide it from a store populated during splash, preserving synchronous access.
- **Fallback — hook swap:** if a screen must become async, we change only its import line to a hook that returns the same-shaped array (the dispatch explicitly permits changing the data-source import). We do **not** alter JSX/logic.

Decision on which pattern per screen is logged in `PROJECT_STATE.md` as screens are wired. The splash screen doubles as the data-preload window (see §7).

## 5. Backend (NestJS + Prisma)

- Modules: `auth` (verify Supabase JWT), `documentaries`, `feed`, `live`, `ads`, `campaigns`, `wallet`, `approvals`, `admin`, `sponsors`, `payments` (Razorpay), `social` (Meta), `audit`.
- Prisma against the same Supabase Postgres (`DATABASE_URL` = Supabase connection string, direct + pooled).
- Service-role Supabase key held server-side for Storage signing and privileged ops.
- Guards: `SupabaseAuthGuard`, `RolesGuard` (viewer/sponsor/admin).
- Wallet: all balance changes in a single DB transaction; per-post deduction is idempotent (keyed by post id) so a retry never double-charges.

## 6. Payments (Razorpay) — gated

- Backend creates a Razorpay **order** for a wallet top-up amount, returns order id to client, client opens Razorpay checkout, backend verifies signature on callback, then credits wallet in a transaction.
- **Live transactions are a hard boundary** — built and testable in test mode only; no live charge without explicit approval. Test-mode keys only until then.

## 7. Splash + PWA

- **Splash**: new `SplashScreen` component with a layered animation (logo mark draw-in/scale, wordmark + tagline reveal, red accent sweep), 1.8–2.2s, then `onDone()` → Home. `App.tsx` already renders `<SplashScreen onDone={...}>` first; we only replace the component's internals. The splash window is also used to kick off `loadInitialData()` so content is warm when Home paints.
- **PWA**: enhance `manifest.json` (multi-size PNG/maskable icons, screenshots, categories), add a service worker (Workbox or hand-rolled) for app-shell + static caching and offline fallback, register it in `main.tsx` (allowed — not UI). Verify installability on mobile/tablet/desktop; Android TV uses the same responsive shell (`useDevice` → `tv`).

## 8. SEO/AEO/GEO (Phase 5, separate)

A standalone Next.js app (`seo-site/`) renders server-side: per-documentary/category pages with dynamic `<title>`/meta/OG, `VideoObject` JSON-LD (the core AEO lever), `LocalBusiness`/district landing pages (GEO), and a CMS-driven `sitemap.xml`/`robots.txt`. It reads the same Supabase data and deep-links "Watch Now" into the SPA. It does **not** modify or server-render the SPA. Timing (now vs later) is an open decision in BLOCKERS.

## 9. Environments & secrets

- `.env` (frontend, `VITE_` prefixed, public): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`.
- `backend/.env` (server, secret): `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `RAZORPAY_KEY_ID`/`SECRET` (test), `META_*` (deferred).
- No secrets committed; `.env.example` files checked in. Actual Supabase project/keys are a setup dependency (BLOCKERS) — schema and code are written against them but not provisioned without approval.

## 10. Testing strategy

- Type safety: `npm run typecheck` gates every commit.
- Service-layer unit tests: each mapper returns objects that satisfy the mock interface (compile-time + runtime shape assertions against a captured mock snapshot).
- Backend: wallet deduction idempotency + approval state-machine tests.
- Manual parity check: run SPA against seeded Supabase and diff against mock build screen-by-screen.
