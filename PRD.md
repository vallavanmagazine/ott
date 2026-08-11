# PRD.md — Vallavan OTT Platform

Product requirements. Source: `VALLAVAN_BACKEND_INTEGRATION_SEO_DISPATCH.md` + direct inspection of the uploaded frontend. This documents what the product **is** and **must do**; `ARCHITECTURE.md` covers how.

## 1. Vision

A Tamil-first documentary OTT service that is **free to watch for everyone**, funded by sponsors rather than subscriptions. Sponsors buy in-app placements and social cross-posts on a **wallet-based, pay-per-published-post** basis, targeted to Tamil Nadu districts. Content (long-form documentaries, short-form feed reels, live TV) is managed through an Admin CMS.

## 2. Personas & access model

| Persona | Auth | Can do |
|---|---|---|
| **Viewer** | None required. Guest/local identity. | Watch all content free. Local Watch History / Watch Later. Optional cross-device account is an open question (see BLOCKERS). |
| **Sponsor** | Login required (Supabase Auth) **only** for Business Center. | Create/manage campaigns, upload creatives, geo-target, top up wallet, view analytics, use AI Studio/Assistant. |
| **Admin** | Login required (Supabase Auth, role=admin). Accessed via `#admin` hash route. | Full CMS: documentaries, feed content, live TV schedule, users, sponsors, campaign approvals, ad management, revenue reports, audit logs, settings. |

Viewing is never gated. Login is surfaced only when a sponsor-only Business Center action is tapped (`SponsorLoginModal`).

## 3. Content types

1. **Documentaries** — long-form. Shape: `Documentary` (bilingual title/synopsis, genre, duration, poster/backdrop, year, language, badge, exclusive flag, progress, director, cast). 13 genres (`Genre` union).
2. **Inspire items** — short-form inspirational shorts with quotes. Shape: `InspireItem`.
3. **Feed reels** — TikTok-style short vertical content (News / Teaser / Short Story). Shape: `FeedReel` with engagement counts, publish status, ordering, and ad-host flags (`stripAdHost`, `bannerAfter`, `attachedCampaign`).
4. **Live TV** — scheduled slots on "VALLAVAN TV". Shape: `LiveSlot` with `isLive` flag.

All are bilingual (English + Tamil, `*Ta` fields) and managed via Admin CMS.

## 4. Advertising & monetization

- **Model**: wallet-based, **pay-per-published-post** — NOT CPM/CPC, NOT subscription. Each published poster / reel-promo / peak-content unit for a campaign is one billable unit.
- **Price scaling**: per-post cost scales with geo-target scope (more districts → higher cost). **Exact formula TBD by Murugavel** (BLOCKERS).
- **Distribution channels per post**:
  - In-app placements: Home/Explore/Live/Inspire banners, Feed strip ads, Feed interstitials, video pre-roll/mid-roll.
  - Vallavan's own social pages (Facebook/Instagram via Meta Graph API).
  - **Open question**: does a dual-channel (app + social) post count as 1 or 2 billable units? (BLOCKERS)
- **Geo-targeting**: Tamil Nadu district level. 36 districts defined in `tamilNaduDistricts`.
- **Ad content shape**: `AdContent` (sponsor, logo, headline, body, cta, bgImage, accent color).
- **Campaign lifecycle**: Draft → Pending Approval → Active → Paused/Ended. Admin approves/rejects.
- **Payments**: Razorpay for wallet top-ups only (no recurring billing).

## 5. Functional requirements by area

### 5.1 Viewer app (locked UI — data swap only)
- **Home**: featured hero carousel (first 3 docs), sponsored banners, Continue Watching (docs with `progress`), Popular, New Releases (`badge === 'NEW'`), Live Now strip (the `isLive` slot), Editor's Choice (`exclusive`).
- **Explore**: genre-filtered browsing (chips from `genres`), trending/latest/editors/per-genre rows, native + banner ads.
- **Feed**: vertical reel scroller with strip ads and interstitial banners injected by `buildFeedSequence()` logic (respects `stripAdHost`, `bannerAfter`, `order`).
- **Inspire**: category chips (`inspireCategories`), hero, Inspiring Lives / Daily Dose (quote cards) / Young & Fearless rows.
- **Live**: on-air hero, sponsored banner, today's schedule grid.
- **Search**: query over documentaries (title/titleTa/genre), genre+language+duration+year filters, recent + trending searches.
- **Detail / Player**: documentary metadata, related, pre-roll/mid-roll/end ad overlays.
- **Notifications**: grouped unread/read list.
- **Profile**: guest vs sponsor state (via `AuthContext`), Business Center entry points, admin panel link.

### 5.2 Sponsor Business Center (Phase 2)
Screens exist (locked UI): SponsorDashboard, CreateCampaign, MyCampaigns, CampaignAnalytics, Billing, GeoTargeting, CreativeLibrary, AIStudio, AIAssistant. Backend must supply: campaign CRUD, wallet balance + top-up, per-post deduction, analytics, creative storage, geo selection persistence.

### 5.3 Admin CMS (Phase 1–3)
Screens exist (locked UI): Dashboard, Users, Documentaries, FeedContent, LiveTV, Sponsors, CampaignApprovals, AdManagement, CMS, RevenueReports, Settings, AuditLogs, Login. Backend must supply CRUD + workflow for each, with audit logging.

## 6. Non-functional requirements

- **PWA**: installable across mobile / tablet / desktop / Android TV. `manifest.json`, service worker, offline shell, proper icons. `useDevice.ts` already drives responsive + TV layouts — keep intact.
- **Splash screen**: polished animated app-open (logo scale/fade or draw-in, tagline reveal, smooth transition into Home), ~1.5–2.5s, Netflix/Discovery+ quality bar.
- **Bilingual**: all content carries English + Tamil; Noto Sans + Noto Sans Tamil already wired.
- **Performance**: content reads should be fast (direct Supabase queries with indexes); money/writes through NestJS.
- **Security**: RLS on Supabase; public read only for published content; all mutations authenticated & authorized by role; wallet deductions server-side only.
- **SEO/AEO/GEO** (Phase 5): crawlable SSR pages, `VideoObject` JSON-LD, dynamic sitemap/robots/OG — in a separate site, not the SPA.

## 7. Out of scope (for now)

- Real video transcoding/streaming pipeline (mock uses images; storage schema anticipates real media URLs).
- Recurring subscriptions / premium tiers (product is AVOD-only).
- Native mobile apps (PWA covers install).

## 8. Success criteria for the integration

1. Every screen renders identically to the mock build, now backed by live Supabase data.
2. Zero changes to locked UI files beyond import swaps.
3. `npm run typecheck` + `npm run build` pass.
4. Admin can create/edit/publish content and see it appear in the viewer app.
5. Sponsor wallet + campaign lifecycle works end-to-end (minus live Razorpay charge, which stays gated).
6. PWA installs on all four device classes; splash animation meets the quality bar.
