# BLOCKERS.md — Open Questions & Dependencies

Things that need a human decision (mostly Murugavel) or an external setup step before the dependent work can complete. None of these block **Phase 1**; they gate Phases 2, 4, and 5. Each has a proposed default so work can proceed if no answer arrives.

Legend: 🟥 decision needed · 🟧 external setup dependency · 🟨 informational / low-risk default in use.

---

## 🟥 B1 — Exact per-post pricing formula
**Question:** How is the price of one published post computed as a function of geo-target scope (district count) and content/placement type?
**Blocks:** Phase 2 wallet deduction, Phase 3 ad serving cost.
**Why it matters:** deduction amount must be exact and auditable; can't finalize the `pricing` config or `wallet_transactions` amounts without it.
**Proposed default (until confirmed):** `price_paise = base_post_price + (per_district_price × districtCount)`, configurable in a `pricing_config` table, all-TN treated as full district count. Placeholder numbers, flagged in code as `TODO(pricing)`. **Do not run any real charge on placeholder pricing.**

## 🟥 B2 — Dual-channel (app + social) billing unit count
**Question:** When a post is published to BOTH in-app placements AND Vallavan's social pages, is that **1** billable unit or **2**?
**Blocks:** Phase 2 billing, Phase 4 publish-tied deduction.
**Proposed default:** model each published channel as its own billable `post` row; a `campaign_post` can fan out to 1..n channel-posts. Bill per channel-post (i.e. dual = 2) but keep a single flag `bill_as_single` so the answer can flip to 1 without schema change.

## 🟥 B3 — Viewer account strategy
**Question:** Do we add an optional lightweight viewer account for cross-device Watch History / Watch Later sync, or keep viewer identity fully local?
**Blocks:** nothing hard — affects whether we add a `viewer_profiles` table + Supabase Auth for viewers.
**Proposed default:** keep viewers fully local (localStorage) for now, as the dispatch suggests. Schema leaves room (`viewer_id` nullable) to add later without migration pain. Watch History / Watch Later remain client-side in Phase 1.

## 🟧 B4 — Supabase project provisioning + keys
**Dependency:** a real Supabase project (URL, anon key, service-role key, DB connection string) must be created and shared.
**Blocks:** running the app against live data, applying migrations, Storage.
**Status:** schema/seed/code are written against Supabase but **not applied** — no project provisioned, and provisioning/deploy is outside the local-only mandate without approval. `.env.example` documents every required variable. Local dev can run against a local `supabase start` (Docker) if approved, or a shared cloud project when credentials are provided.

## 🟧 B5 — Meta Business account readiness
**Dependency:** Vallavan's Facebook Page + Instagram Business account must exist and be **verified for publishing permissions** (Meta app review, tokens) before Phase 4 can be built/tested end-to-end.
**Blocks:** Phase 4 social publishing (also a hard boundary — no publish without approval).
**Status:** setup dependency, not a code task. Phase 4 code can be scaffolded against the Graph API but cannot publish until this exists and approval is given.

## 🟥 B6 — Razorpay account + live-charge approval
**Dependency:** Razorpay account with test keys (for building) and, separately, explicit approval before any **live** transaction.
**Blocks:** Phase 2 wallet top-up end-to-end (test mode buildable now with test keys).
**Status:** live transaction is a hard boundary. Build against test keys only; no live charge without explicit approval.

## 🟥 B7 — SEO/AEO/GEO layer timing
**Question:** Build the separate Next.js SSR public layer now (Phase 2, parallel) or defer to closer to public launch (Phase 5)?
**Blocks:** nothing — it is independent of the wallet/CMS/ad backend.
**Proposed default:** defer to Phase 5 as roadmapped; core backend first. Revisit when public launch date is set.

## 🟨 B8 — Admin write path: NestJS vs Supabase RLS
**Question (my call, logged for visibility):** For Phase-1 admin CMS writes, go through a NestJS API now, or use RLS-scoped Supabase writes and add NestJS in Phase 2 when wallet logic forces it?
**Proposed default:** stand up a minimal NestJS backend now (it's needed by Phase 2 anyway) but keep Phase-1 admin content writes simple; money/approval logic waits for Phase 2. Will log the concrete choice in `PROJECT_STATE.md` before implementing.

---

### Answered / resolved
- ✅ GitHub remote + SSH alias — confirmed working (`vallavanmagazine/ott.git`, `-vallavan` alias authenticates, repo readable, `main` exists at `6ac9279`).
