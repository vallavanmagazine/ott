# Vallavan Backend (NestJS)

Server-side service layer for sensitive operations. **Secrets live here only** —
never in the frontend bundle. Keys are read by `SettingsService` from the
`platform_settings` table (set via the admin "API Settings" page) with a
`process.env` fallback.

## Modules
- **wallet** — Razorpay **test-mode** order/verify, balance, idempotent per-post deduction (`kind+reference` unique). Never live charges.
- **campaigns** — lifecycle: Draft → Pending Approval → Active → Paused/Ended.
- **ai** — AI Studio ad-creative generation via Anthropic (`claude-sonnet-5`).
- **messaging** — email (Resend), OTP+SMS (Fast2SMS), WhatsApp (Meta Cloud), push (Firebase FCM).
- **social** — Meta publish **stub only** (no live calls; BLOCKERS B5).
- **common** — service-role Supabase client + SettingsService.

## Endpoints (prefix `/api`)
- `POST /wallet/create-order`, `POST /wallet/verify`, `GET /wallet/balance/:sponsorId`, `GET /wallet/transactions/:sponsorId`
- `POST /campaigns`, `POST /campaigns/:id/{submit,approve,reject,pause,resume}`
- `POST /ai/ad-creative`
- `POST /otp/send`, `POST /otp/verify`
- `POST /social/publish` (stub)

## Run
```bash
cd backend
cp .env.example .env   # fill SUPABASE_SERVICE_ROLE_KEY etc.
npm install
npm run prisma:generate
npm run start:dev      # http://localhost:3001/api
```

Set the frontend's `VITE_API_BASE_URL=http://localhost:3001` so AI Studio + wallet top-up reach it.

## Status
Scaffolded and coherent, **not yet installed/built in this repo checkout** (server-side app; the user runs `npm install` + `npm run build`). Not deployed.
