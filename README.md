# YoTicks

YoTicks is an Expo Router ticketing app with a local Express + Prisma backend.

It now covers the full demo journey for both sides of the marketplace:

- attendee event discovery, search, detail, reservation, and checkout handoff
- dynamic ticket tiers with live inventory, sold-out states, quantity limits, waitlist handling, and promo code quoting
- personalized discovery with recent searches, trending events, nearby filtering, followed organizers, and "because you liked" recommendations
- notification inbox plus local device reminders for confirmations and event reminders
- QR ticket delivery and ticket detail views
- organizer console, event creation, event editing, publishing state, media fields, analytics, and ticket operations
- organizer QR/manual ticket check-in
- organizer merchant onboarding before payment collection
- account login, registration, profile editing, and password reset
- seeded local data in SQLite for venues, events, users, tickets, providers, and merchant accounts
- deterministic local venue and event artwork rendered as PNG data URLs

## Local Development

Install dependencies:

```bash
npm install
```

Run the Expo app:

```bash
npm run web
```

Run the backend API:

```bash
npm run server:dev
```

## Core Flows

Attendee flows available in the app:

- browse featured events on the home tab
- search by query, category, organizer, or city
- open `/event/[id]` for the full event detail experience
- reserve from `/reserver/[id]`
- complete the provider handoff at `/checkout/[sessionId]`
- open `/ticket/[id]` for QR ticket delivery
- update account details from the profile tab
- reset a forgotten password from the login screen

Organizer flows available in the app:

- open the organizer console at `/(organizer)`
- create a new event at `/(organizer)/events/new`
- edit publishing state, media, and inventory-ready event details from `/(organizer)/events/[id]`
- inspect ticket details and update status or gate assignment
- scan attendee QR passes or enter ticket codes manually at `/(organizer)/scan`
- complete merchant payout information at `/(organizer)/payouts`
- review organizer analytics for sales, funnel, top cities, and event performance from `/(organizer)`

## Backend Persistence

The backend persists demo state in SQLite at:

```text
server/prisma/dev.db
```

It keeps:

- users
- venues
- events
- event tiers
- promo codes
- tickets
- notifications
- search history
- followed organizers and categories
- event interaction analytics
- waitlist entries
- saved events
- merchant accounts
- checkout sessions
- provider users

It starts from the seed data in `server/src/seed.ts` and writes changes as the app is used.
Re-running the seed also refreshes venue and event images so the database does not keep stale artwork.
Saved events persist across reloads, and organizer changes are written back into the same local database.

For isolated tests and disposable local runs, the backend also honors `YOTICKS_DB_FILE`.
Point it at another SQLite file to boot the API against a temporary database without touching `server/prisma/dev.db`.

To create or refresh the database locally:

```bash
npm run server:db:setup
```

## Payments And Merchant Readiness

Paid reservations go through a checkout-session flow instead of issuing tickets immediately.

1. The attendee chooses a payment method on `/reserver/[id]`.
2. The app creates `/api/payments/checkout-sessions`.
3. The provider handoff screen opens at `/checkout/[sessionId]`.
4. If the organizer merchant profile is incomplete, the flow routes to `/(organizer)/payouts` so payment collection is blocked until merchant details are entered.

## Camera And QR Scanning

Organizer check-in uses `expo-camera` with barcode scanning enabled in `app.json`.
If you run the native app, grant camera permission when prompted so the scan screen can read attendee passes.
The current configuration follows the Expo SDK 56 camera plugin setup for barcode scanning:
[Expo Camera SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/sdk/camera/).

## Local Origins

For browser development, the backend accepts the usual loopback origins:

- `http://localhost:19006`
- `http://127.0.0.1:19006`
- `http://[::1]:19006`

This prevents local CORS mismatches when switching between loopback hosts.

## Verification

App tests:

```bash
npm test
```

Backend tests:

```bash
npm --prefix server test
```

TypeScript checks:

```bash
npm exec tsc --noEmit
npm --prefix server exec tsc --noEmit
```

The test coverage now includes:

- recommendation and reservation flow logic
- notification date parsing
- i18n and live refresh utilities
- provider and saved-event API behavior
- seeded database setup
- venue image generation
- end-to-end backend behavior for auth, reservations, checkout, saved events, notifications, discovery, analytics, publishing, and organizer flows

## Known Remaining Risk

`npm audit --omit=dev` still reports moderate vulnerabilities in Expo toolchain dependencies pulled in by the SDK 56 stack.
The current audit output does not provide a safe in-line upgrade path for this app without leaving the supported Expo version line, so those findings should be revisited when upstream Expo packages publish patched releases.
