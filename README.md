# WebCidClean

Cleaning company management app: clients (prospect → contacted → in_process → quoted → pending → active → archived), job sites with areas, quotes with a public approve/request-changes/decline link, job activation, staff assignments, and a basic accounting view (service amount − staff payment = profit).

This is a functional-first MVP — styling is intentionally minimal (Tailwind utility classes, no design system) until the flows below are validated.

## Stack

- React + TypeScript + Vite (static SPA, no server)
- Tailwind CSS v4
- react-router-dom
- Supabase (Postgres + Auth + Storage) — all data access happens directly from the browser
- `@react-pdf/renderer` for client-side quote PDF generation

## Setup

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

The Supabase project already has the schema, RLS policies, RPC functions, and storage buckets required by this app (see `supabase/migrations` history applied via the Supabase MCP tools during setup). The admin login (`admin@cidclean.com`) already exists in Supabase Auth — no seeding needed.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm run typecheck` — TypeScript only
- `npm run lint` — oxlint
- `npm run preview` — preview the production build locally

## Deploying to Netlify

`netlify.toml` is already configured (`npm run build`, publish `dist`, SPA redirect). In the Netlify site settings, set the environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (the Supabase **publishable** key, safe to expose client-side)

## Data model & business rules

- **Clients**: `prospect` → `contacted` → `in_process` → `quoted` → `pending` → `active` → `archived`. Job sites can only be added while a client is `in_process`.
- **Job sites**: `new` → `approved` (via client-approved quote) → `active` (via admin "Activate Job", which requires the client to have billing info and at least one signed document, and sets the service amount / staff payment amount) → `archived`.
- **Quotes**: built from a job site's areas/line items, generate a PDF (uploaded to the public `quote-pdfs` bucket) and a shareable link (`/q/:token`, no login required). The client can Approve (records name/email/role), Request Changes, or Decline (both require a reason). Sending a quote sets the client to `quoted`; an approval sets the job site to `approved` and the client to `pending`.
- **Staff**: employees or contractors, assigned to job sites with a per-job payment amount.
- **Accounting**: for every active job site, profit = service amount − staff payment amount.

All the multi-table status transitions (send quote, public approve/decline/changes, activate job, assign staff) go through Postgres RPC functions (`security definer`) rather than raw table writes, so the business rules are enforced server-side even though this is a single-admin MVP. The public `/q/:token` route only ever calls `get_public_quote` / `respond_to_public_quote` — it never reads Supabase Auth session state and has no access to internal fields (`service_amount`, `staff_payment_amount`, internal client status).

## Manual end-to-end test

1. Log in at `/login` with `admin@cidclean.com`.
2. Create a client (prospect) → Mark Contacted → Move to In Process.
3. Add a job site (pick a frequency like weekly, select days, set a preferred start time).
4. Add a couple of areas, upload a picture to one.
5. Create a quote, add line items, click **Send Quote** (generates + uploads the PDF, sends, sets client to `quoted`).
6. Open the printed share link in an incognito window (no login) — confirm no internal fields leak in the network response — and Approve with a name/email/role.
7. Back in the admin, confirm the job site is `approved` and the client is `pending`.
8. Fill in the client's Billing tab and upload a document to the Documents tab.
9. On the job site, **Activate Job** with a service amount and staff payment amount — confirm job site becomes `active` and client becomes `active`.
10. Create a staff member, assign them to the job site with a payment amount.
11. Check `/accounting` — the job site should show service amount, staff payment, and profit.

This exact flow (steps 1–11, plus the double-submit protection on the public link, the RLS check that `anon` cannot read tables directly, and the guard that blocks `Activate Job` without billing info/documents) was already run once against the live Supabase project via its REST/RPC API and passed end-to-end. It has not yet been click-tested in a real browser from this environment — the sandbox's outbound proxy and headless Chromium don't complete the TLS tunnel to Supabase here, so do a quick pass through the UI yourself (`npm run dev`) before considering it fully verified.
