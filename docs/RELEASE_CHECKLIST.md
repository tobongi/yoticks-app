# YoTicks Release Checklist

## Automated gate

- [ ] `npm ci` succeeds from the single `package-lock.json`.
- [ ] `npm run typecheck` reports zero TypeScript errors.
- [ ] `npm run lint` reports zero errors and zero warnings.
- [ ] `npm test` passes every app, security, and API regression test.
- [ ] `npm --prefix server test` passes the backend suite.
- [ ] `npx expo-doctor` passes all checks.
- [ ] `npm run build` exports iOS, Android, and web bundles and builds the server.
- [ ] `npm audit --omit=dev` has no actionable production vulnerability with a compatible Expo 56 fix.

## Attendee device gate

- [ ] Fresh install reaches onboarding, can skip interests, and resumes after interruption.
- [ ] Registration validates required fields and password length; login survives a full app restart.
- [ ] Expired/invalid sessions return to signed-out state without demo identity.
- [ ] Password recovery message opens `yoticks://auth/reset`, changes the password once, and rejects reuse.
- [ ] Home, search, event detail, filters, saved events, and empty/error states remain readable at 200% font size.
- [ ] VoiceOver and TalkBack announce every pictogram action with a concrete name, role, state, and outcome.
- [ ] All controls remain operable at 200% text and expose a touch target of at least 48 x 48 logical pixels.
- [ ] Tap-to-hear guidance speaks onboarding, ticket presentation, and scanner instructions on a physical Android and iOS device; the iOS check is repeated with silent mode off.
- [ ] Five first-time participants from the target audience complete discovery, reservation, and ticket presentation without coaching; misunderstood pictograms are replaced, not explained with more text.
- [ ] Free reservation issues the expected ticket and notification prompt appears only after intent.
- [ ] Paid reservation is visibly unavailable while its provider flag is false; no paid QR can be issued through the API.
- [ ] Mobile-money country and currency are selected explicitly; changing either clears any incompatible network selection.
- [ ] A pending payment shows the automatic-check countdown, the 90-second timeout explanation, and a working **Vérifier maintenant** action.
- [ ] Failed and cancelled payments show a clear **Réessayer** action and do not reuse a terminal provider transaction.
- [ ] Closing the app during a sandbox payment does not prevent confirmation: the signed webhook issues exactly one ticket and the ticket appears after relaunch.
- [ ] Ticket QR, state label, event, holder, and manual code remain legible at the venue entrance.
- [ ] Notification tap routes only to allow-listed event/ticket/inbox destinations.
- [ ] Account editing, language, permission state, legal content, sign-out, and password-confirmed deletion work.

## Organizer device gate

- [ ] Attendee accounts cannot enter organizer routes.
- [ ] Organizer dashboard shows current queue/status and the scanner is the dominant action.
- [ ] Camera rationale is contextual; denial preserves manual ticket-code entry and opens system settings when requested.
- [ ] Valid, already-used, cancelled, and unknown scans have distinct text, color, haptic/vibration, and recovery actions.
- [ ] Gate staff can identify all four scan outcomes at arm's length using the seal shape, pictogram, and short label without relying on color alone.
- [ ] Event create/edit/publish, inventory, city grouping, ticket detail, gate override, payouts, and support survive app restart.

## Store gate

- [ ] Railway deploys from `/server` using the committed Dockerfile and `railway.json`; `/api/health` verifies the database connection.
- [ ] A persistent Railway volume is mounted at `/data` and `YOTICKS_DB_FILE=/data/yoticks.db`; a restart preserves users, checkouts, transactions, and tickets.
- [ ] `npm run payments:webhook:check` returns HTTP 200 with `ok: true` from the exact deployed `MBIYOPAY_WEBHOOK_URL`.
- [ ] The MBIYOPAY dashboard callback uses `/api/payments/mobile-money/webhook`; a signed sandbox callback receives HTTP 200 and an unsigned callback receives HTTP 401.
- [ ] Immediate-success, delayed-success, amount-mismatch, repeated-refresh, and repeated-webhook sandbox cases preserve the payment state machine and issue tickets exactly once.
- [ ] The server is deployed with `PAID_CHECKOUT_ENABLED=true` before the Expo binary is built with `EXPO_PUBLIC_ENABLE_PAID_CHECKOUT=true`.

- [ ] App icons, adaptive icon, monochrome icon, splash, screenshots, description, keywords, support URL, privacy URL, and terms URL are uploaded.
- [ ] App Store privacy answers match `app.json` privacy manifest and `docs/PRIVACY.md`.
- [ ] Google Play Data Safety answers match the same data inventory.
- [ ] Reviewer attendee/organizer accounts and review notes are verified against the production review environment.
- [ ] Build numbers/version codes were auto-incremented and the exact submitted binaries passed the device gate.
