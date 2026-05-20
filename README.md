# Keepsake

A personal inventory app for households and collectors. Catalog your books,
antiques, DVDs, collectibles — anything — with photos, intended recipients,
and a printable QR sticker per item so a designated executor can identify
and inherit each one.

> ⚠️ **Important**
> Keepsake is a personal inventory tool. It is **not a will**, not legal or
> estate advice, and not a substitute for either. To make legally-binding
> decisions about who inherits your property, please consult an attorney and
> prepare a proper will.

---

## What you need before you start

1. **Node.js** installed on your computer.
   - Download from <https://nodejs.org> — the "LTS" version is fine.
2. **A free Supabase account.**
   - Sign up at <https://supabase.com> and create a new project.
   - Wait ~1 minute for the project to be ready.
3. **The Expo Go app on your phone.**
   - iPhone: search "Expo Go" on the App Store.
   - Android: search "Expo Go" on Google Play.

---

## One-time setup

### 1. Install the dependencies

Open a terminal in this folder (the one that contains `package.json`) and run:

```bash
npm install
```

This downloads everything the app needs. It takes a few minutes the first time.

### 2. Set up your Supabase project's database

1. Go to your Supabase project at <https://app.supabase.com>.
2. In the left sidebar click **SQL Editor** → **New query**.
3. Open the file [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   from this folder. Copy its entire contents and paste into the SQL editor.
   Click **Run**.
4. Repeat for [`supabase/migrations/0002_verify_bcrypt.sql`](supabase/migrations/0002_verify_bcrypt.sql).

If both runs say "Success", your database is ready. You can re-run these
files later without breaking anything — they're idempotent.

### 3. Connect the app to Supabase

In the same folder where you ran `npm install`, copy the example env file:

```bash
cp .env.example .env
```

Open `.env` in a text editor and fill in:

- `EXPO_PUBLIC_SUPABASE_URL` — your project's URL. Find it in Supabase under
  **Project Settings → API → Project URL**.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — the **anon public** key on the same
  Settings → API page.
- `EXPO_PUBLIC_QR_LANDING_BASE_URL` — where the **web** version of this app
  is reachable. During development this is the same URL Expo shows when you
  run `npm run web` (typically `http://localhost:8081`). When you eventually
  host the web build somewhere, replace this with that URL.

### 4. Deploy the executor-unlock Edge Function

The QR landing page calls a secure server function so private data can never
be exposed by URL alone. To deploy it:

1. Install the Supabase CLI: <https://supabase.com/docs/guides/cli>
2. From this folder, log in: `supabase login`
3. Link your project: `supabase link --project-ref <your-project-ref>`
   (the ref is in your Supabase project URL).
4. Deploy:

   ```bash
   supabase functions deploy executor-unlock --no-verify-jwt
   ```

   The `--no-verify-jwt` flag is required — anonymous visitors scan the QR
   code without a Supabase session, and the function does its own
   authorization via the executor code.

---

## Running the app

### On your phone (recommended for development)

```bash
npm start
```

A QR code will appear in your terminal. Open the **Expo Go** app on your
phone and scan it. The app will load instantly.

### In a web browser

```bash
npm run web
```

A browser tab will open at <http://localhost:8081>. The web version is what
people see when they scan an item's QR sticker — they go straight to
`/i/<id>` and are asked for an executor access code.

---

## How it's organized

```
app/                  # Screens (Expo Router file-based routing)
  _layout.tsx           Root layout, providers
  login.tsx             Email + password sign-in
  signup.tsx            Account creation
  (app)/                Authenticated app — redirects to /login if not signed in
    _layout.tsx
    index.tsx           List of your inventories
    new-inventory.tsx
    invites.tsx         Pending invites
    settings.tsx        Sign out, disclaimer
    scan.tsx            QR scanner (uses the camera)
    inventory/[id]/
      index.tsx         Items list with search + filter
      settings.tsx      Rename, delete, sharing, executor codes, access log
      labels.tsx        Generate printable PDF of QR labels
      item/
        new.tsx
        [itemId]/
          index.tsx     Item detail with photos
          edit.tsx
          history.tsx   Revision history
          qr.tsx        QR code for this item
  i/[public_id].tsx   PUBLIC QR landing page (no login required)

components/
  Disclaimer.tsx        The "not a will" notice
  ItemForm.tsx          Shared item create/edit form
  PhotoStrip.tsx        Photo gallery + uploader

lib/
  supabase.ts           Supabase client (uses .env vars)
  auth.tsx              Auth context + provider
  api.ts                All Supabase queries in one place
  categories.ts         Category presets and their custom fields
  format.ts             Money, date, random code helpers
  types.ts              TypeScript types matching the DB

supabase/
  migrations/           SQL you ran in step 2
  functions/
    executor-unlock/    The server function for the QR landing page
```

---

## What's where (mapping to the build spec)

| Phase | Where to look |
|------|---------------|
| **0 – Setup, schema, disclaimer** | `supabase/migrations/0001_init.sql`, `components/Disclaimer.tsx`, `app/_layout.tsx` |
| **1 – Auth + Inventories + Items** | `app/login.tsx`, `app/signup.tsx`, `app/(app)/index.tsx`, `app/(app)/inventory/[id]/*`, `components/ItemForm.tsx`, `components/PhotoStrip.tsx`, `lib/categories.ts` |
| **2 – QR codes, labels, executor unlock** | `app/(app)/inventory/[id]/item/[itemId]/qr.tsx`, `app/(app)/inventory/[id]/labels.tsx`, `app/i/[public_id].tsx`, `supabase/functions/executor-unlock/index.ts`, `app/(app)/inventory/[id]/settings.tsx` (executor codes section), `supabase/migrations/0002_verify_bcrypt.sql` |
| **3 – Sharing + roles** | `app/(app)/inventory/[id]/settings.tsx` (sharing section), `app/(app)/invites.tsx`, RLS policies in `0001_init.sql` |
| **4 – History / audit trail** | `app/(app)/inventory/[id]/item/[itemId]/history.tsx`, the `record_item_revision` trigger and `restore_item_revision` RPC in `0001_init.sql` |
| **5 – Polish** | Search & category filter in `app/(app)/inventory/[id]/index.tsx`, total value per inventory, currency on each item |

---

## Things to know

- **Executor codes are shown once.** When you generate a code, copy or
  screenshot it immediately. Only the encrypted hash is stored, so we
  literally cannot recover or show it again.
- **The QR sticker unlocks the whole inventory, read-only.** Anyone with a
  valid executor code can see every item in that inventory's QR landing
  pages. This is intentional — your executor needs to know what else is
  there. If this isn't what you want, revoke the code and issue a new one
  scoped differently (you'll need to extend the schema for that).
- **Photo bucket is public.** File paths are unguessable UUIDs, so URLs are
  effectively private. If you need stricter privacy, switch the bucket to
  private and use signed URLs in `lib/api.ts` → `photoPublicUrl`.
- **Hosting the web build.** When you're ready to give out QR stickers in
  the real world, run `npm run export:web` and deploy the `dist/` folder to
  any static host (Vercel, Netlify, Cloudflare Pages). Set
  `EXPO_PUBLIC_QR_LANDING_BASE_URL` to that host's URL before generating QR
  labels.

---

## Common problems

**"Cannot find module 'expo'"** — run `npm install` again from this folder.

**"Network request failed" when signing in** — your `.env` values are
missing or wrong. Restart `npm start` after editing `.env`.

**"new row violates row-level security"** — the migration didn't run, or
the auth user doesn't have a profile row yet. Sign out and back in; the
trigger creates the profile automatically on signup.

**The QR landing page says "Invalid or revoked code"** — codes are
case-sensitive and exact. They look like `ABCD-EFGH-JKLM-NPQR`. Copy/paste
the original value you saved.

**Edge function returns 404** — you haven't deployed it yet. Re-read step 4
above. Until you do, the QR landing page won't be able to unlock anything.

---

## License

MIT (do what you want, but it's not a will).
