# Optimum Optic — ERP

Full-stack ERP for an optical retail store (opticien): clients, prescriptions,
catalog & stock, sales/POS, deposits & payments, cash register, invoicing,
and role-based access for Admin / Opticien.

This repo has two parts:

- **`/` (root)** — the public marketing/landing page for optimumoptic.com,
  deployed via GitHub Pages (`CNAME`, `index.html`). Untouched by this
  project.
- **`/frontend`** — the ERP web app: React + TypeScript + Vite + Tailwind
  CSS v4, PWA-installable.
- **`/database`** — the PostgreSQL schema, RLS policies, and business-logic
  functions, designed to run on [Supabase](https://supabase.com)
  (Postgres + Auth + Realtime).

## Status: Phase 1 MVP

Per the phased build-out plan, this is Phase 1: authentication & roles,
dashboard, clients/CRM, prescriptions, product catalog & stock, sales/POS
with live margin & discount rules, deposits/payments, cash register,
and invoicing — all backed by real transactional database logic, not mocks.

**Fully implemented and tested:**
- Complete PostgreSQL schema (40+ tables) with row-level security
- Transactional RPC functions (`create_sale`, `record_payment`,
  `open_cash_register`, `close_cash_register`, `apply_stock_movement`,
  `cancel_sale`, `authorize_discount_override`) — see
  [database/migrations/016_rpc_functions.sql](database/migrations/016_rpc_functions.sql)
- The mandatory end-to-end test scenario from the spec (client → prescription
  → sale with discount & margin → deposit → order workflow → balance payment
  → cash register closure → audit log), run against a real local Postgres —
  see [database/local_dev/test_scenario.sql](database/local_dev/test_scenario.sql)
- Full React frontend for all Phase 1 modules, type-checked and built
  successfully (`npm run build`)

**Not yet built (Phase 2/3, per the original spec's own phasing):**
- Orders/atelier Kanban UI (the DB schema and status-history tracking exist
  and were tested; only the dedicated UI is missing)
- Suppliers UI, quotes UI, credit installment UI, appointments, promotions UI
- Statistics/analytics dashboards beyond the main KPI dashboard
- Barcode scanning, CSV/Excel import-export, WhatsApp/SMS/email marketing
- Offline mode
- New-user creation from within the app (currently done via the Supabase
  dashboard — see below)

**Important limitation of this session:** there is no live Supabase project
connected here, so the frontend has been verified with `tsc --noEmit`,
`vite build`, and a rendered screenshot of the login page — but not against
a real backend end-to-end in a browser. The database layer *was* fully
exercised against a real local PostgreSQL instance (see Testing below).
Before real use, follow the setup steps below and re-verify the golden path
in a browser against your own Supabase project.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Note your project's **URL** and **anon public key** (Settings → API).
3. In the SQL Editor, run every file in `database/migrations/` **in order**
   (001 → 018). Each file is idempotent-safe to inspect but not designed to
   be re-run twice — run once on a fresh project.
4. Run `database/seed/001_base_seed.sql` to create roles, the default store,
   payment methods, expense categories, and product categories.
5. Create your first two users under **Authentication → Add User** (one
   admin, one opticien). Copy their user IDs.
6. Give each a profile row:
   ```sql
   insert into profiles (id, store_id, role_id, first_name, last_name, max_discount_percent)
   select '<admin-user-id>', s.id, r.id, 'Prénom', 'Nom', 100
   from stores s, roles r where r.key = 'admin' limit 1;
   ```
   (similarly for the opticien with `role.key = 'opticien'` and a lower
   `max_discount_percent`, e.g. 10).
7. Optional: run `database/seed/002_demo_data.sql` (after editing the two
   placeholder UUIDs at the top to match your real admin/opticien user IDs)
   to populate a full fictional demo dataset — 130 products, 30 customers,
   18 sales in various payment states, etc. No real personal data is used.
8. In **Database → Publications**, confirm `supabase_realtime` includes the
   tables listed in `database/migrations/018_realtime.sql` (the migration
   adds them automatically if the publication already exists, which it does
   by default on every Supabase project).

## 2. Run the frontend

```bash
cd frontend
cp .env.example .env
# edit .env: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your project
npm install
npm run dev
```

Open the printed local URL, sign in with the admin or opticien account you
created in step 1.6.

### Build & deploy

```bash
npm run build   # outputs frontend/dist — static, deploy anywhere (Vercel, Netlify, Cloudflare Pages, etc.)
```

The app is a PWA — installable on desktop and mobile once deployed over
HTTPS.

## 3. Testing the database layer locally (no Supabase needed)

`database/local_dev/` contains a minimal mock of Supabase's `auth` schema so
the full schema + RPC functions can be exercised against a plain local
PostgreSQL instance — useful for verifying migrations before pointing them
at a real project. **Never run `local_dev/000_mock_supabase_auth.sql`
against a real Supabase project** — it already has a real `auth` schema.

```bash
createdb optimum_optic_test
cd database
psql -d optimum_optic_test -f local_dev/000_mock_supabase_auth.sql
for f in migrations/*.sql; do psql -d optimum_optic_test -f "$f"; done
psql -d optimum_optic_test -f seed/001_base_seed.sql
psql -d optimum_optic_test -f local_dev/test_scenario.sql
```

`test_scenario.sql` runs the full mandatory scenario end-to-end (client →
ordonnance → vente avec remise → acompte → commande → atelier → solde →
clôture de caisse) plus negative tests for the permission rules (discount
limit enforcement, stock-adjustment admin-only, oversell prevention) and
prints `PASS`/`FAIL` for each.

## Key design decisions

- **Financial logic lives in the database, not the frontend.** Every price,
  tax, discount, margin, stock, and cash calculation is recomputed and
  validated server-side inside `SECURITY DEFINER` RPC functions — the
  frontend only *previews* these values for UX. Sales, sale line items,
  payments, and stock movements cannot be written directly by the client;
  RLS blocks direct `INSERT`/`UPDATE` on those tables (`... for insert with
  check (false)`), forcing all writes through
  `create_sale`/`record_payment`/`apply_stock_movement`.
- **Margin/cost visibility is role-gated at the database layer**, not just
  hidden in the UI: `v_products` and `v_sales` are views that return `null`
  for `purchase_price_ht`/`cost_total`/margin fields when the querying
  user isn't an admin (`is_admin()` check evaluated per-row from the
  caller's JWT). An opticien session never receives that data over the
  wire.
- **Discount authorization** above an opticien's configured limit requires
  a genuine admin credential check (`authorize_discount_override`, which
  verifies the admin's password against `auth.users` server-side) before
  `create_sale` will accept the discount.
- **One products table**, not four (montures/verres/lentilles/accessoires),
  with 1-1 detail tables per type — keeps stock, pricing, and margin logic
  in one place instead of duplicated four times.
- **Deposits are payments**, not a separate table: a `payments.payment_type
  = 'acompte'` row *is* the deposit. Avoids two ledgers going out of sync.
- **Document numbers** (`CL-000001`, `VTE-2026-000001`, ...) are always
  server-assigned via `next_document_number()`, either inside the RPC
  functions or via `BEFORE INSERT` triggers — never client-supplied.

## Project structure

```
/                     landing page (unrelated to the ERP, GitHub Pages)
/database
  /migrations         numbered SQL migrations, run in order on Supabase
  /seed                base + demo data
  /local_dev           local-Postgres-only auth mock + test scenario
/frontend
  /src
    /components        shared UI, layout, and per-module form components
    /contexts           auth + theme React contexts
    /lib                supabase client, formatting helpers
    /pages              one folder per module (dashboard, clients, sales, ...)
    /types/database.ts  hand-written types mirroring the SQL schema
```
