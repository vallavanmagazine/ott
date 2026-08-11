# PROJECT_STATE.md — Running Log

Newest first. Records where things stand, decisions taken, and why. Read after `CLAUDE.md` to catch up.

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

### Not done / next
- Initialize git, push to `backend-integration-dev`, verify with `git ls-remote` (in progress this session).
- Then Phase 1 implementation: `seed.sql`, `src/lib` + `src/services` + data hooks, import swaps, NestJS scaffold, splash build, PWA.

### Open blockers (see BLOCKERS.md)
B1 pricing formula · B2 dual-channel billing · B3 viewer accounts (default chosen) · B4 Supabase project provisioning · B5 Meta readiness · B6 Razorpay + live-charge approval · B7 SEO timing · B8 admin write path (default chosen). None block Phase 1 code; B4 blocks *running* against live data.

### Notes for the human
- Nothing deployed, no live charges, no Meta calls, no push to main — all four hard boundaries respected.
- To run against real data I need a Supabase project's URL + keys (B4), or your OK to run a local Supabase (Docker) instance.
