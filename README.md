# YoTicks

YoTicks is an Expo Router ticketing app with a local Express + Prisma backend.

It covers the release-candidate journey for both sides of the marketplace:

- attendee event discovery, search, detail, reservation, and checkout handoff
- dynamic ticket tiers with live inventory, sold-out states, quantity limits, waitlist handling, and promo code quoting
- personalized discovery with recent searches, trending events, nearby filtering, followed organizers, and "because you liked" recommendations
- notification inbox plus local device reminders for confirmations and event reminders
- QR ticket delivery and ticket detail views
- organizer console, event creation, event editing, publishing state, media fields, analytics, and ticket operations
- organizer QR/manual ticket check-in
- organizer merchant onboarding before payment collection
- account login, registration, secure native session restoration, profile editing, single-use password recovery, and in-app deletion
- seeded local data in SQLite for venues, events, users, tickets, providers, and merchant accounts
- deterministic local venue and event artwork rendered as PNG data URLs
- a low-literacy visual language with concrete SVG pictograms, ticket-shaped objects, color-plus-label status seals, 48px touch targets, and optional tap-to-hear guidance

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

Paid inventory is fail-closed. The public reservation endpoint returns HTTP 402 for a paid tier, so it cannot issue a QR without verified payment. The client also keeps paid checkout disabled unless `EXPO_PUBLIC_ENABLE_PAID_CHECKOUT=true` is explicitly provided.

1. The attendee chooses a payment method on `/reserver/[id]`.
2. The app creates `/api/payments/checkout-sessions`.
3. The provider handoff screen opens at `/checkout/[sessionId]`.
4. If the organizer merchant profile is incomplete, the flow routes to `/(organizer)/payouts` so payment collection is blocked until merchant details are entered.

MBIYOPAY production configuration is server-only: set `MBIYOPAY_API_KEY`, `MBIYOPAY_WEBHOOK_SECRET`, `MBIYOPAY_API_BASE_URL`, and `MBIYOPAY_WEBHOOK_URL` in the hosting environment. The canonical callback is `https://<api-host>/api/payments/mobile-money/webhook`; `/api/mbiyopay/notify` remains accepted only for compatibility with an older dashboard configuration. Never put the private key or webhook secret in Expo public variables or tracked files.

Paid checkout has two independent switches: `PAID_CHECKOUT_ENABLED=true` on the server and `EXPO_PUBLIC_ENABLE_PAID_CHECKOUT=true` in the Expo build. Production server startup refuses the server switch when the provider key, signature secret, public HTTPS host, or canonical callback path is missing. The callback route answers `GET` with a redacted readiness document and accepts only correctly signed provider `POST` requests.

The server converts application amounts to MBIYOPAY's lowest denomination and validates provider transaction ID, order ID, amount, and currency before issuing inventory. Initiation, PIN finalization, manual refresh, webhook handling, and reconciliation all use an authenticated provider-status lookup. Repeated confirmations are idempotent and issue the requested tickets exactly once.

For sandbox testing, use the MBIYOPAY Test API Key with the same API base URL. The documented CD test numbers ending in `0000`, `1111`, `2222`, `3333`, and `9999` simulate successful, pending, and failed transactions without real money. Sandbox transactions are isolated from live balances.

Production activation order is strict:

1. Deploy the API and apply the production database schema.
2. Configure the provider key, webhook signature secret, and canonical callback URL in the host and MBIYOPAY dashboard.
3. Keep both paid-checkout switches false and run `npm run payments:webhook:check`. It must return HTTP 200 and report `ok: true`.
4. Run a signed sandbox payment, close the app while it is pending, and confirm the webhook issues exactly one ticket.
5. Set `PAID_CHECKOUT_ENABLED=true`, redeploy the API, set `EXPO_PUBLIC_ENABLE_PAID_CHECKOUT=true`, and create fresh store binaries.

The complete Railway setup, persistent-volume contract, activation procedure, and incident recovery steps are in [`docs/PAYMENTS_DEPLOYMENT.md`](docs/PAYMENTS_DEPLOYMENT.md).

The checkout asks the attendee to select the mobile-money country and currency explicitly. Pending payments poll automatically, show a visible 90-second timeout and manual refresh action, and failed/cancelled attempts expose a fresh retry action. A checkout-session record or provider screen is never treated as payment.

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

Full release gate:

```bash
npm run verify
```

Store submission, privacy, terms, and device gates are documented in `docs/STORE_SUBMISSION.md`, `docs/PRIVACY.md`, `docs/TERMS.md`, and `docs/RELEASE_CHECKLIST.md`.
The interface rules and field-validation protocol are documented in `docs/LOW_LITERACY_DESIGN.md`.

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
