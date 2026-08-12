# Vallavan SEO Site (Next.js SSR)

Separate crawlable public layer (Phase 13). The main app stays a CSR Vite SPA;
this SSR site gives search + AI answer engines real HTML.

## Pages
- `/` — landing with published documentaries.
- `/documentaries/[id]` — dynamic `<title>`/meta/OG + **VideoObject JSON-LD** (core AEO lever) + "Watch Now" deep-link into the SPA.
- `/genre/[genre]` — genre browse pages.
- `/sitemap.xml` — generated live from the `documentaries` table.
- `/robots.txt`.

## Run (build/verify — NOT deployed this session)
```bash
cd seo-site
cp .env.example .env.local   # NEXT_PUBLIC_SUPABASE_ANON_KEY etc.
npm install
npm run build
```

## Status
Scaffold — real App Router pages; **not installed/built in this session** (would
pull the full Next toolchain). Reads the same Supabase data; deep-links into the SPA.
