# Rezara — product & code audit

Scope: the business web app (`artifacts/booking-platform`), the customer payment page, and the API (`artifacts/api-server`).
Everything marked **Fixed** is in this branch and was verified by running the app locally (Postgres + API + web).
I checked it with a scripted browser at phone (390px) and desktop (1280px) sizes in EN, FR and AR, and with direct API calls.

## 1. Security & correctness (fix before anything else)

| # | Severity | Finding | Status |
|---|---|---|---|
| S1 | **Critical** | `/auth/send-otp` returned the sign-in code in its response unless `OTP_TEST_MODE=false` was set. In production that means **anyone can sign in as any phone number, including admin phones**. | **Fixed**: test mode now defaults to off in production builds. It can still be turned on explicitly, and the server logs a warning when it is. ⚠️ See "Action needed" below. |
| S2 | **High** | `/payments/paypal/capture-order` trusted the `linkId` sent by the browser. A customer could pay the order for a cheap reservation and confirm a different, expensive one. | **Fixed**: the order is looked up server-side and must belong to that reservation. Capture is idempotent. |
| S3 | High | The public `/reservations/:linkId` endpoint (anyone with the link) returned the business's **internal notes**, the customer's phone, and the owner's account fields (`userId`, approval status/notes). | **Fixed**: it now returns only what the payment page shows. |
| S4 | High | No `trust proxy`, so behind Replit's proxy **every visitor shared one rate-limit bucket** (200 req / 15 min for the whole platform). | **Fixed**: per-visitor limits (1000 / 15 min), plus a tighter limit on the two OTP endpoints. |
| S5 | Medium | Admin revenue and settlements summed payments with status `completed`, but payments are stored as `paid`, so revenue was always 0. | **Fixed** |
| S6 | Medium | Phone numbers weren't normalized, so `+212 6…`, `06…` and `00212…` created three separate accounts. `ADMIN_PHONES` only matched the exact typed format. | **Fixed**: canonical `+212…` form. Legacy accounts are migrated the next time they sign in. |
| S7 | Medium | Anonymous visitors could request upload URLs for the storage bucket. | **Fixed**: sign-in required. |
| S8 | Medium | No server-side validation of reservation date, time, guests or deposit (the API accepted `25:00`, 0 guests, negative deposits). | **Fixed** |
| S9 | Low | Payment history returned `date`, but the client expects `reservationDate`, so the reservation date always showed "N/A". | **Fixed** |
| S10 | Low | The repo didn't typecheck (ambiguous `api-zod` exports, a non-composite project reference). | **Fixed**: `pnpm run typecheck` and both builds pass. |
| S11 | Low | The brand font never loaded: Google Fonts' family name is `MuseoModerno`, not `Museo Moderno`. | **Fixed** (app and landing page) |

## 2. UX findings

### Navigation & structure
- On phones, every action was behind a hamburger menu, and "New reservation" (the main action) was only on some pages. **Fixed**: there's a bottom tab bar with a central **+** button and a "More" sheet. The desktop sidebar has a primary New Reservation button.
- Reservations and Calendar used the same icon. **Fixed**
- The language switcher loaded flag images from a third-party CDN. **Fixed**: it's now a text-only EN / FR / ع toggle, and it also appears on the login and customer pages.

### Onboarding & approval
- **Dead end:** the "Account under review" screen's *Complete your profile* button went to Settings, which was wrapped in the same gate. Owners could never edit their profile while pending. **Fixed**: Settings isn't gated, and the pending screen shows a profile checklist.
- A new owner landed on an empty dashboard with no explanation of the product. **Fixed**: 3-step onboarding (profile → reservation → send link). Saving the first profile takes the owner forward automatically.
- The gate screens were English-only. **Fixed**

### Creating a reservation
- The time picker was a 96-item dropdown. **Fixed**: native time input. The form also gains Today/Tomorrow chips, a guest − / + stepper, deposit presets and a sticky submit button on phones.
- Capacity limits set in the Calendar were never used. **Fixed**: a soft warning shows when a booking goes over the day or time-slot limit (e.g. "8 of 10 people already booked").
- The WhatsApp message showed a raw `2026-03-30` date and a hard-coded "15 minutes". **Fixed**: it uses the localized date and the real expiry setting.
- Notes were labelled "internal" but were shown to the customer (see S3). **Fixed**, and the form now says they're private.

### Managing a reservation
- Status changes happened through a raw dropdown with an "Apply" button: you could set "confirmed" by accident and cancel with no confirmation. **Fixed**: the page shows the next step for each status:
  - *awaiting payment*: send on WhatsApp, copy link, copy message, native share, a live "expires in N min" countdown, **Mark as paid (cash)**, and Cancel (with a confirmation).
  - *expired*: **Re-activate link**. Expiry is now counted from the last update, so this gives the customer a fresh window.
  - *confirmed*: **Customer came → complete**, or cancel (with a refund reminder).
  - *cancelled*: Restore.
- There was no way to fix a wrong time or guest count. **Fixed**: an Edit dialog (the deposit is locked once paid).
- The page polls while payment is pending, so it flips to "Paid" by itself.

### Lists & dashboard
- The *Manage* button only appeared on hover, so it was invisible on phones. Tables scrolled sideways. **Fixed**: every row is a tappable card.
- The list gained status chips with counts, Upcoming / Past / All tabs, search by phone, and sorting by the booking date (not the date it was created). The dashboard stat cards link to the filtered list, and the filters live in the URL.
- The dashboard showed only "recently created" bookings. **Fixed**: it now shows **Upcoming (soonest first)** plus a "N reservations waiting for their deposit" call-to-action.

### Customer payment page
- A **completed** reservation showed "Loading payment…" forever. **Fixed**
- There was no language choice, and a mistyped link showed "Link expired". **Fixed**: language switcher, a proper "Link not found" state, and a contact-the-business button on the expired and cancelled states.
- **Added:** an expiry countdown, a map link for the address, a tap-to-call phone, and "Add to my calendar" (.ics) after paying. Error messages are now human-readable and localized.

### Localization & accessibility
- Dates were always English (`format(new Date(...))`), and `new Date("YYYY-MM-DD")` parses as UTC, which shows the previous day west of UTC. **Fixed**: localized date-fns, the week starts Monday in FR/AR, and amounts use a locale-aware "50 MAD" that doesn't flip in Arabic.
- Many strings were hard-coded English (gate, payment result pages, 404, settings hints, validation messages, payment statuses, "guests"). **Fixed**: 300+ keys checked in all three languages, with correct Arabic plural forms.
- Other fixes:
  - The viewport blocked pinch-zoom (`maximum-scale=1`). **Fixed**
  - Form labels weren't linked to their inputs. **Fixed**
  - Icon buttons had no names. **Fixed**
  - Added a skip link, `aria-current`, and `prefers-reduced-motion` support.
  - The 404 page said "Did you forget to add the page to the router?". **Fixed**

## 3. Action needed from you

1. **Sign-in in production.** No SMS/WhatsApp provider is connected: `send-otp` only stores the code.
   - With the S1 fix, production users won't see a code on screen. Until you connect a provider (Twilio, WhatsApp Business API, Infobip…), an admin must issue codes (Admin → Businesses → Generate code).
   - You can set `OTP_TEST_MODE=true` to restore the old behaviour, but understand the risk (S1).
   - The admin phone itself also needs a code. Bootstrap it with the DB or temporarily with `OTP_TEST_MODE=true`.
2. **Deploying:** the app runs on Replit (`https://rezara--succesmktgcom.replit.app`), and `www.titsuit.com/rezaraapp` redirects to it (Cloudflare Worker on the `titsuit-www` branch). It is not published on optimumoptic.com. This code lives only on the `claude/app-audit-ux-q8f711` branch: copy `rezara-app/` back into your Replit project and redeploy. To make payment links show the titsuit.com address, set `PUBLIC_BASE_URL=https://www.titsuit.com/rezaraapp` on Replit.

## 4. Recommended next steps (not done here)

- **PayPal webhook** (`PAYMENT.CAPTURE.COMPLETED`). If the customer closes the tab between approving and the capture call, the order stays approved but uncaptured and the booking isn't confirmed. A webhook makes confirmation reliable.
- **Local payment options.** Charging MAD deposits in USD through PayPal at a fixed `MAD_PER_USD` rate adds friction for Moroccan customers. Consider CMI or another local card processor.
- **Link expiry default.** 15 minutes is short for a WhatsApp flow where customers read messages later. Try `RESERVATION_EXPIRY_MINUTES=60` and watch how many links expire.
- **Enforce capacity server-side** if owners want hard limits (today it's a warning).
- **Reminders:** an automatic WhatsApp reminder the day before, and a follow-up when a link is about to expire.
- **Refunds:** cancelling a paid booking doesn't refund anything; add a PayPal refund action.
- **Admin panel:** still English-only and desktop-oriented. It works, but it wasn't part of this pass.
- **Shared rate-limit store:** the OTP throttles are in memory, so they reset on restart and aren't shared across instances.
- **Tests:** there are none. Start with API tests for the auth, reservation and payment routes changed here.
