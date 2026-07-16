# Payment Production Completion Plan

**Goal:** Make MBIYOPAY mobile-money checkout trustworthy end to end: provider calls use the documented API, a confirmed payment issues tickets exactly once, production refuses unsafe configuration, deployment is reproducible, and the live webhook can be verified.

**Confirmed root causes**

- Transaction listing uses an obsolete `/api/v1/transactions` path instead of `/api/v1/merchant/transactions`.
- A provider response that is immediately `successful` is stored as terminal before ticket issuance. The refresh route then skips it because it only reconciles pending records, leaving a paid order without tickets.
- The public API hostname currently reaches Railway's fallback service and has no working application behind it.
- Deployment and persistent SQLite storage are not described or encoded in the repository.

**Implementation sequence**

1. Correct the provider transaction endpoint with a regression test.
2. Add route-level tests proving an immediately successful provider payment is independently verified, issues inventory once, and remains idempotent on refresh.
3. Centralize provider reconciliation so initiation, refresh, scheduled recovery, and webhooks use the same monotonic state transition and ticket-issuance path.
4. Keep newly initiated payments pending until the server verifies their provider status; never trust a client or an unverified callback to issue inventory.
5. Add production startup/deployment configuration, health checks, persistent database setup, and secret/readiness validation.
6. Document the payment state machine, Railway setup, webhook URL, recovery procedure, and release verification.
7. Run typecheck, lint, focused tests, full tests, Expo Doctor, production builds, local sandbox checkout, and live deployment smoke tests.
8. Publish the verified changes, configure Railway and the MBIYOPAY webhook, and perform a no-real-money sandbox transaction through the deployed service.

**Acceptance criteria**

- Every MBIYOPAY request uses a documented merchant endpoint and keeps the API key server-side.
- Only a signed webhook or authenticated provider-status lookup can move a transaction to `successful`.
- Successful payment reserves the exact order and issues tickets exactly once, including immediate sandbox successes and repeated callbacks/refreshes.
- Amount, currency, order reference, and checkout ownership are validated before issuance.
- Production startup fails closed when paid checkout, webhook, database, or reset-delivery configuration is unsafe.
- The deployed `/health` and payment-readiness endpoints succeed over HTTPS and the canonical webhook is configured in MBIYOPAY.
- The complete verification ladder passes and the production runbook matches the shipped system.
