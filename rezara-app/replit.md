# Rezara — SaaS Booking Confirmation Platform

A full-stack platform for businesses (restaurants, salons, clinics) to manage reservations and collect deposits via PayPal payment links.

## Architecture

**pnpm monorepo** with the following packages:

| Package | Path | Purpose |
|---|---|---|
| `@workspace/booking-platform` | `artifacts/booking-platform/` | React + Vite frontend (port from $PORT) |
| `@workspace/api-server` | `artifacts/api-server/` | Express 5 API server (port 8080) |
| `@workspace/db` | `lib/db/` | Drizzle ORM + PostgreSQL schema |
| `@workspace/api-zod` | `lib/api-zod/` | Zod schemas generated from OpenAPI spec |
| `@workspace/api-client-react` | `lib/api-client-react/` | React Query hooks (Orval codegen) |
| `@workspace/replit-auth-web` | `lib/replit-auth-web/` | `useAuth()` hook for the web app |
| `@workspace/api-spec` | `lib/api-spec/` | OpenAPI YAML spec + codegen scripts |

## Key Features

- **Business dashboard** with stats (total reservations, revenue, upcoming bookings)
- **Reservations management** — create, view, edit, cancel, complete
- **Unique payment links** — each reservation gets `/r/:linkId` for customers
- **Stripe deposit collection** — checkout sessions via Replit connectors SDK
- **Calendar view** — visual month calendar with per-day capacity management (daily limit + hourly time slots)
- **Payment history** — all payments with status tracking
- **Settings page** — business profile (name, logo, phone, address, description)
- **Admin panel** — view all businesses, reservations, payments (requires ADMIN_EMAILS env var)
- **Notifications bell** — bell icon in sidebar/mobile header with unread badge; shows recent paid deposits; marks read on open; refetches every 30s
- **Standalone landing page** — `artifacts/rezara-landing/` at `/rezara-landing/` (marketing page, no auth required)
- **Logo upload** — Settings page lets businesses upload a logo image directly (GCS presigned URL flow via object storage); also accepts an external URL as fallback; served at `/api/storage/objects/…`
- **Full i18n** — English / French / Arabic (RTL) via `i18next`+`react-i18next`; `LanguageSwitcher` 🇬🇧🇫🇷🇲🇦 in sidebar + mobile header; language persisted in `localStorage` key `rezara_lang`; all pages fully translated

## Authentication

Replit Auth (OIDC with PKCE). Session cookies stored in PostgreSQL `sessions` table.

- Login: `GET /api/login`
- Callback: `GET /api/callback`
- Logout: `GET /api/logout`
- Current user: `GET /api/auth/user` → `{ user: AuthUser | null }`

## API Routes

All routes prefixed with `/api`:

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/healthz` | No | Health check |
| GET | `/auth/user` | No | Get current user |
| GET/POST | `/businesses/me` | Yes | Business profile upsert |
| GET | `/reservations` | Yes | List reservations (filter by status) |
| POST | `/reservations` | Yes | Create reservation (generates linkId) |
| GET | `/reservations/:linkId` | No | Public reservation view (for customer page) |
| PUT | `/reservations/:linkId` | Yes | Update reservation |
| DELETE | `/reservations/:linkId` | Yes | Cancel reservation |
| POST | `/reservations/:linkId/complete` | Yes | Mark as completed |
| POST | `/payments/checkout` | No | Create Stripe checkout session |
| POST | `/stripe/webhook` | No | Stripe webhook handler |
| GET | `/payments` | Yes | Payment history |
| GET | `/dashboard/stats` | Yes | Dashboard statistics |
| GET | `/notifications` | Yes | Recent paid deposit notifications |
| GET | `/capacity` | Yes | List capacity slots (optional ?date= filter) |
| POST | `/capacity` | Yes | Create or update a capacity slot |
| DELETE | `/capacity/:id` | Yes | Delete a capacity slot |
| GET | `/admin/businesses` | Admin | All businesses |
| GET | `/admin/reservations` | Admin | All reservations |
| GET | `/admin/payments` | Admin | All payments |

## Database Schema

Tables: `sessions`, `users`, `businesses`, `reservations`, `payments`, `capacity_slots`

Reservation statuses: `pending_payment` → `confirmed` (after Stripe) | `cancelled` | `completed`

Payment statuses: `pending` → `paid` | `expired` | `failed` | `refunded`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection (auto-provisioned) |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Yes | PayPal REST app credentials |
| `PAYPAL_MODE` | Optional | `sandbox` (default) or `live` |
| `MAD_PER_USD` | Optional | Conversion rate for charging MAD deposits in USD (default 10) |
| `ADMIN_PHONES` | Optional | Comma-separated admin phone numbers (any format; normalized to +212…) |
| `PUBLIC_BASE_URL` | Optional | Base URL used in payment links sent to customers |
| `RESERVATION_EXPIRY_MINUTES` | Optional | How long an unpaid payment link stays valid (default 15). Counted from the last update, so re-activating an expired reservation gives a fresh window |
| `OTP_TEST_MODE` | Optional | `true` shows sign-in codes on screen. **Defaults to on in development and off in production** — with it on, anyone can sign in as any phone number. Until an SMS/WhatsApp provider is wired into `/auth/send-otp`, production sign-in codes are issued by an admin (Admin → Businesses → Generate code) |

## Stripe Integration

Uses Replit connectors SDK (`@replit/connectors-sdk`) for authenticated Stripe API calls (no raw API key needed). Stripe connection in sandbox/test mode.

To enable webhook verification, set `STRIPE_WEBHOOK_SECRET` from your Stripe Dashboard → Webhooks → Your endpoint → Signing secret.

## Codegen

After updating `lib/api-spec/openapi.yaml`:
```bash
pnpm --filter @workspace/api-spec run codegen
cd lib/api-client-react && pnpm exec tsc --build
cd lib/replit-auth-web && pnpm exec tsc --build
```

This regenerates `lib/api-zod/src/generated/api.ts` and `lib/api-client-react/src/generated/api.ts`.
The `tsc --build` steps update the `dist/` declaration files needed by TypeScript project references.

## Currency
MAD (Moroccan Dirham) — used throughout the app for deposit amounts.
