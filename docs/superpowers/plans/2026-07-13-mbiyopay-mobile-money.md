# MBIYOPAY Mobile Money Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use TDD and verify each server/payment state before shipping.

**Goal:** Add a secure MBIYOPAY mobile-money payment flow to the existing YoTicks checkout.

**Architecture:** The Expo client talks only to the YoTicks backend. The backend stores payment transactions, calls MBIYOPAY with a server-only key, accepts a signed webhook, and exposes a status endpoint. Successful provider responses remain pending until the webhook confirms payment.

**Tech Stack:** Expo SDK 56 / React Native 0.85, Expo Router, Express, Prisma SQLite, Node test runner, TypeScript.

---

### Scope

- Add a mobile-money payment option and customer phone/network fields.
- Add MBIYOPAY payin initiation, transaction persistence, webhook verification, and status lookup.
- Keep API keys and webhook secrets server-only.
- Do not issue tickets from an unverified provider response.
- Support provider response modes (`pending`, `confirm`, `pin`, and `redirect`) without storing customer PINs.

### Verification

- TDD tests cover request mapping, HMAC verification, webhook idempotency, and authorization boundaries.
- Run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`.
- Configure rotated MBIYOPAY credentials in the deployment environment before live testing.
