# Heirloom

A personal inventory app for households and collectors. Catalog your books,
antiques, DVDs, collectibles — anything — with photos, intended recipients,
and a printable QR sticker per item so a designated executor can identify
and inherit each one.

> ⚠️ **Important**
> Heirloom is a personal inventory tool. It is **not a will**, not legal or
> estate advice, and not a substitute for either. To make legally-binding
> decisions about who inherits your property, please consult an attorney
> and prepare a proper will.

---

## Setup from an iPad (no terminal required)

Everything below can be done in Safari on an iPad. You'll create two free
accounts (Supabase + Vercel), paste one SQL file, and click a deploy
button.

### Step 1 — Create your Supabase project

1. Open <https://supabase.com> in Safari and sign up (free tier is plenty).
2. Click **New project**. Pick a name, a password (any), and the region
   nearest you. Wait ~60 seconds for it to spin up.
3. From the left sidebar, open **SQL Editor** → **New query**.
4. In another Safari tab, open this repo on GitHub and view
   **`supabase/migrations/0001_init.sql`**. Tap **⋯** → **Copy raw file**.
5. Paste the whole thing into the Supabase SQL editor and tap **Run**.
   You should see "Success. No rows returned."

That's the entire database setup. The migration creates every table, all
the security rules, the revision trigger, the storage bucket for photos,
and the secure `unlock_item_for_executor` function that the QR landing
page calls — no separate Edge Function deploy.

> **Re-running is safe.** If something looks wrong, you can re-run the
> SQL file as many times as you want. It drops and recreates policies
> idempotently.

### Step 2 — Grab your Supabase keys

In Supabase, go to **Project Settings → API** (gear icon on the left).
Keep this tab open — you'll need:

- **Project URL** — looks like `https://abcdef.supabase.co`
- **anon public** key — long string starting with `ey…`

### Step 3 — Deploy the web app to Vercel (one click)

The fastest path:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frobertboot%2FExecutor&env=EXPO_PUBLIC_SUPABASE_URL,EXPO_PUBLIC_SUPABASE_ANON_KEY,EXPO_PUBLIC_QR_LANDING_BASE_URL&envDescription=From%20your%20Supabase%20project%27s%20API%20settings.%20Leave%20QR_LANDING_BASE_URL%20blank%20and%20set%20it%20to%20your%20Vercel%20URL%20after%20the%20first%20deploy.&project-name=heirloom&repository-name=heirloom)

Or do it manually:

1. Fork or push this repo to your own GitHub account (if it isn't there
   already — your iPad's GitHub website works fine for forking).
2. Open <https://vercel.com> in Safari and sign in **with GitHub**.
3. Click **Add new… → Project**, find this repo, click **Import**.
4. In the **Environment Variables** section, paste these three:
   - `EXPO_PUBLIC_SUPABASE_URL` → your project URL from step 2
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` → the `anon` key from step 2
   - `EXPO_PUBLIC_QR_LANDING_BASE_URL` → leave blank for now, you'll set
     it after the first deploy when you have a Vercel URL
5. Click **Deploy**. After ~2 minutes Vercel gives you a URL like
   `heirloom-abc123.vercel.app`.
6. Go back to Vercel's project → **Settings → Environment Variables** and
   set `EXPO_PUBLIC_QR_LANDING_BASE_URL` to your new Vercel URL (with
   `https://` in front, no trailing slash). Trigger a redeploy.

> Prefer Netlify? It's the same idea: a `netlify.toml` is included, and
> Netlify will detect it automatically when you import the repo.

### Step 4 — Use the app

Open your Vercel URL in Safari (or Chrome) on your iPad. You'll land on
the sign-up screen. Create an account using your real email — Supabase
will email you a confirmation link. Tap it, come back, and sign in.

That's it. You can now create inventories, add items, upload photos
(Safari's file picker handles this), generate executor codes, and print
QR labels.

---

## Optional — Running on your iPhone as a "real" app

If you want the native iOS app instead of (or in addition to) the web
app, install **Expo Go** from the App Store on your iPhone. You'll need
to run a dev server somewhere — on a laptop, on a cloud machine, or via
Expo's hosted preview (EAS Update). The web-app path above is the
zero-friction option.

---

## What's where

```
app/                  Screens (Expo Router file-based routing)
  _layout.tsx           Root layout, providers
  login.tsx             Email + password sign-in
  signup.tsx            Account creation
  (app)/                Authenticated app — redirects to /login if not signed in
    _layout.tsx
    index.tsx           List of your inventories
    new-inventory.tsx
    invites.tsx         Pending invites
    settings.tsx        Sign out, disclaimer
    scan.tsx            QR scanner (uses the camera; web falls back to URL)
    inventory/[id]/
      index.tsx         Items list with search + filter
      settings.tsx      Rename, delete, sharing, executor codes, access log
      labels.tsx        Avery-5160 PDF label sheet
      export.tsx        CSV + PDF inventory export
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

supabase/migrations/0001_init.sql
                      ↑ the only file you paste into Supabase

.github/workflows/build-web.yml
                      Builds the web bundle on every push (CI guardrail)
vercel.json / netlify.toml
                      Build configs for one-click hosting
```

---

## Mapping to the build spec phases

| Phase | Where to look |
|------|---------------|
| **0 – Setup, schema, disclaimer** | `supabase/migrations/0001_init.sql`, `components/Disclaimer.tsx` |
| **1 – Auth + Inventories + Items** | `app/login.tsx`, `app/signup.tsx`, `app/(app)/index.tsx`, `app/(app)/inventory/[id]/*`, `components/ItemForm.tsx`, `components/PhotoStrip.tsx`, `lib/categories.ts` |
| **2 – QR codes, labels, executor unlock** | `app/(app)/inventory/[id]/item/[itemId]/qr.tsx`, `app/(app)/inventory/[id]/labels.tsx`, `app/i/[public_id].tsx`, `unlock_item_for_executor` RPC + `create_executor_code` RPC in `0001_init.sql`, executor-code management in `app/(app)/inventory/[id]/settings.tsx` |
| **3 – Sharing + roles** | `app/(app)/inventory/[id]/settings.tsx` (sharing section), `app/(app)/invites.tsx`, RLS policies in `0001_init.sql` |
| **4 – History / audit trail** | `app/(app)/inventory/[id]/item/[itemId]/history.tsx`, the `record_item_revision` trigger and `restore_item_revision` RPC in `0001_init.sql` |
| **5 – Polish** | Search & category filter in `app/(app)/inventory/[id]/index.tsx`, currency on each item, **CSV + PDF export** at `app/(app)/inventory/[id]/export.tsx` |

---

## Things to know

- **Executor codes are shown once.** When you generate a code, copy it
  immediately. Only the encrypted hash is stored, so we literally cannot
  recover or show it again.
- **The QR sticker unlocks the whole inventory, read-only.** Anyone with a
  valid executor code can see every item in that inventory's QR landing
  pages. This is intentional — your executor needs to know what else is
  there.
- **Photo bucket is public.** File paths are unguessable UUIDs, so URLs
  are effectively private. If you need stricter privacy, switch the bucket
  to private and use signed URLs in `lib/api.ts → photoPublicUrl`.
- **Hosting the web build elsewhere.** Any static host works. Set
  `EXPO_PUBLIC_QR_LANDING_BASE_URL` to wherever the app lives so the QR
  codes point to the right place.

---

## Common problems

**"new row violates row-level security"** — the migration didn't fully
run, or you're trying to do something the policies don't allow. Re-run
`0001_init.sql` in the Supabase SQL editor.

**The QR landing page says "Invalid or revoked code"** — codes are
case-sensitive and exact. They look like `ABCD-EFGH-JKLM-NPQR`. Copy/paste
the original value you saved.

**"Could not unlock" with a network error on the QR landing page** —
double-check that `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY` are set in your hosting provider's
environment and redeploy.

**Email confirmation link goes to a Supabase-hosted page, not the app**
— that's the default. In Supabase **Authentication → URL Configuration**,
set the Site URL to your Vercel URL so confirmation links return there.

---

## License

MIT (do what you want, but it's not a will).
