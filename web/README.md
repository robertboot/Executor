# Heirloom — Web

Next.js 15 (App Router) + Supabase + Tailwind. Same Supabase backend as
the Expo mobile app in the repo root.

## Local dev

```bash
cd web
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
# (Same values as the Expo app's EXPO_PUBLIC_SUPABASE_* vars.)
npm install
npm run dev
# → http://localhost:3000
```

## Deploy (Vercel)

1. Connect the GitHub repo `robertboot/Executor` to a new Vercel project.
2. **Root directory:** set to `web/` in Vercel project settings.
3. **Environment variables** (Vercel → project → Settings → Environment):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — for photo embedding)
   - `EMBEDDING_PROVIDER` = `voyage` (or `cohere`)
   - `VOYAGE_API_KEY` (or `COHERE_API_KEY`)
4. **Supabase Auth → URL configuration:** add your Vercel URL (e.g.
   `https://heirloom-web.vercel.app`) and `localhost:3000` to the allowed
   redirect URLs.
5. **Supabase Auth → Email templates → Magic Link:** make sure the
   `{{ .ConfirmationURL }}` placeholder is present (default is fine).

That's it — push to `main` and Vercel deploys in ~60 s.

## Database setup

The web app reuses the existing Heirloom Supabase tables (`inventories`,
`items`, `item_photos`, `inventory_shares`, `conservators`, etc.) from
the Expo app. No migration needed for the basic CRUD.

For the **scan-to-recognize** feature, run the migration once:

```sql
-- web/supabase/migrations/0001_pgvector_item_photo_embeddings.sql
-- (Paste in the Supabase SQL editor.)
```

This adds:
- `item_photos.embedding vector(1024)` column
- HNSW cosine index for fast nearest-neighbor search
- `match_item_photos(query_embedding, match_count, similarity_threshold)`
  RPC that the scan page calls.

Existing photos need to be back-filled with embeddings. The web app
generates embeddings on upload going forward; for the existing corpus,
run the back-fill script (TODO — `scripts/backfill-embeddings.ts`).

## Architecture

- **Routes** (`app/`):
  - `/login` — magic-link auth
  - `/auth/callback` — code exchange + redirect
  - `/(app)` — authenticated app shell
    - `/home` — dashboard
    - `/collections` — category grid + new-collection picker
    - `/collections/[key]` — items in a collection
    - `/items/[id]` — item detail
    - `/items/[id]/edit` — editor
    - `/items/new` — new item
    - `/scan` — photo recognition
    - `/conservators`
    - `/settings`
  - `/i/[publicId]` — public item landing page (legacy QR target)
- **Data access** (`lib/api.ts`) — all queries server-side. No client
  Supabase calls except for auth (sign-in / sign-out) and storage uploads.
- **Auth** — middleware refreshes the session cookie on every request and
  redirects unauthenticated requests to `/login`.
- **Embeddings** (`lib/embeddings.ts`) — pluggable image embedding
  facade. Configure via `EMBEDDING_PROVIDER` env var.

## What's not yet built

- Photo upload on the item editor (UI is there, upload action TODO)
- Inventory share / invite management UI
- Executor codes (the legacy QR feature isn't being rebuilt)
- PWA offline cache
- Subscription gate (handled externally per product decision)
