# Payments Deployment And Recovery

This runbook is the production contract for the YoTicks API and MBIYOPAY mobile-money checkout.

## Architecture

The Expo client creates a checkout session and sends mobile-money details only to the YoTicks API. The API keeps the MBIYOPAY bearer key and webhook secret private. A ticket is issued only after one of these server-trusted confirmations:

- a webhook with a valid HMAC signature followed by an authenticated MBIYOPAY status lookup; or
- an authenticated MBIYOPAY status lookup during initiation, manual refresh, PIN finalization, or reconciliation.

Every successful confirmation must match the local provider transaction ID, checkout order ID, amount in the provider's lowest denomination, and currency. The database claim and `reservationIssuedAt` marker make repeated callbacks and refreshes idempotent.

## Railway service

Create one persistent Railway service from the GitHub repository with these settings:

- Root directory: `/server`
- Config file: `/server/railway.json`
- Volume mount path: `/data`
- Public custom domain: `api.tobongi.com`

The committed Dockerfile installs locked dependencies, generates Prisma, emits the production JavaScript build, and starts `dist/src/index.js`. Railway checks `/api/health`; that endpoint verifies the SQLite connection rather than returning a process-only heartbeat.

Set these service variables in Railway. Values marked secret must be entered in Railway, never committed:

```text
NODE_ENV=production
YOTICKS_DB_FILE=/data/yoticks.db
JWT_SECRET=<at least 32 random characters>
PASSWORD_RESET_WEBHOOK_URL=<public HTTPS delivery automation>
PASSWORD_RESET_DEEP_LINK_BASE=yoticks://auth/reset
CORS_ORIGINS=<comma-separated production web origins>
CLIENT_URL=<primary production web origin>
MBIYOPAY_API_BASE_URL=https://dashboard.mbiyo.africa
MBIYOPAY_API_KEY=<test or live server key>
MBIYOPAY_WEBHOOK_SECRET=<dashboard webhook secret>
MBIYOPAY_WEBHOOK_URL=https://api.tobongi.com/api/payments/mobile-money/webhook
PAID_CHECKOUT_ENABLED=false
```

Production startup fails if the JWT secret is weak, password-reset delivery is not HTTPS, SQLite is not on an absolute path, or a Railway database path is outside the mounted volume. When paid checkout is enabled, startup also fails if the MBIYOPAY callback is not a public HTTPS URL at the canonical path.

## Activation sequence

1. Deploy with `PAID_CHECKOUT_ENABLED=false` and attach the `/data` volume.
2. Confirm `GET https://api.tobongi.com/api/health` returns HTTP 200.
3. Confirm `npm run payments:webhook:check -- https://api.tobongi.com/api/payments/mobile-money/webhook` reports ready.
4. In the MBIYOPAY dashboard, set the webhook URL to `https://api.tobongi.com/api/payments/mobile-money/webhook` and keep the secret identical to Railway.
5. Run a MBIYOPAY sandbox transaction with a documented test number. Confirm one transaction becomes `successful`, `reservationIssuedAt` is set, and the attendee receives exactly the requested number of tickets.
6. Repeat status refresh and webhook delivery. The ticket count must not change.
7. Set `PAID_CHECKOUT_ENABLED=true` and redeploy the API.
8. Build the Expo client with `EXPO_PUBLIC_API_URL=https://api.tobongi.com/api` and `EXPO_PUBLIC_ENABLE_PAID_CHECKOUT=true`.

## Recovery

- **Provider says successful, local state pending:** call `GET /api/payments/mobile-money/:id/refresh` as the owning attendee or use the organizer reconciliation endpoint. Both perform a fresh authenticated status lookup.
- **Webhook was missed:** call `POST /api/payments/mobile-money/:id/resend-webhook` as the owning attendee. MBIYOPAY re-delivers to the configured callback.
- **Webhook returns 401:** verify the Railway and dashboard webhook secrets are byte-for-byte identical. Do not disable signature verification.
- **Webhook returns 404:** verify the provider order ID matches an existing checkout and the provider transaction ID matches the stored transaction.
- **Successful status remains pending:** compare provider amount, currency, and order ID with the checkout. A mismatch intentionally blocks ticket issuance and requires investigation; never edit the transaction to successful by hand.
- **Deployment health check fails:** inspect startup logs for missing secrets, a missing `/data` volume, schema creation failure, or an unreachable SQLite file. Do not move the database to the ephemeral application filesystem.

The compatibility callback `/api/mbiyopay/notify` remains signature-protected for old provider settings, but all new configuration must use `/api/payments/mobile-money/webhook`.
