# YoTicks Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn YoTicks from a strong local demo into a secure, resilient Expo SDK 56 release candidate for iOS and Android.

**Architecture:** Keep Expo Router and the Express/Prisma API, but introduce small testable boundaries for runtime configuration, session persistence, and account lifecycle. Preserve the attendee and organizer flows while making release behavior fail closed, moving permission prompts to contextual actions, and adding the legal/support surfaces and build configuration required before store submission.

**Tech Stack:** Expo SDK 56, React Native 0.85, Expo Router, TypeScript, Express, Prisma/SQLite, Node test runner, EAS Build.

---

## Product decision briefs

### UX decision brief

- Job: help an attendee find an event, reserve it, and retrieve the QR quickly; help door staff validate entry without hesitation.
- User mode: first-time and returning attendees; repeat-use organizer operators.
- Frequency/risk: occasional purchase plus high-volume scanning; money, identity, and admission access are high-risk.
- Pattern: guided setup with skip/resume for attendees; command surface with visible status and recovery for organizers.
- Primary action: attendee “Voir / Réserver”; organizer “Scanner”.
- Secondary actions: search, saved events, ticket wallet, manual code entry, event management.
- Core path: discover -> inspect -> choose tier -> review -> reserve/pay -> ticket QR; organizer dashboard -> scan -> explicit valid/used/blocked result.
- Recovery path: preserve entered data, expose retry/back actions, distinguish offline/API failure from empty data, and never issue paid tickets without confirmed payment.
- Required states: empty, loading, partial, offline/error, permission denied, success, sold out/waitlist, and long-running provider handoff.
- Handoff constraints: one obvious action per screen, 48px targets, numbers/status before prose, no permission prompt before intent.

### UI decision brief

- Surface type: native mobile task flow plus organizer monitoring cockpit.
- Platform idiom: React Native translated for Apple and Android navigation, permission, and system behavior.
- Product thesis: a warm city ticket and a fast gate instrument, not a generic events catalogue.
- Originality seed: festival wristband + transit departure board; the ticket is the main object; clipped ticket corners/status stamps repeat.
- Composition archetype: attendee object-detail stage; organizer instrument panel.
- Layout sketch: `[city/status header] [tonight ticket] [quick actions] [event line-up]`; organizer `[gate status] [scanner] [manual fallback] [recent results]`.
- Typography personality: Poppins display and UI for direct friendliness; numeric status uses heavy weight; banned fallback is thin luxury typography.
- Visual direction: warm paper, ink, orange action, green only for verified admission, red only for blocked/destructive state.
- Density: balanced attendee, operational organizer.
- Hierarchy: current event/ticket or scan result first, one primary action, secondary filters and settings below.
- Component grammar: ticket panels, status stamps, chips, bottom tabs, sheets, short forms, scan console.
- Motion budget: subtle system transitions and status feedback; reduced motion preserves every state change.
- State visuals: shaped skeleton/loader, actionable empty state, inline error/retry, permission explainer, next action after success.
- Tasteful risk: oversized ticket/status object; restrained by native controls, consistent radii, and no decorative animation.
- Bans: generic dashboard cards, five equal CTAs, spinner-only waits, silent fallback data in production, custom platform controls for novelty.

## Task 1: Deterministic SDK 56 foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Delete: `pnpm-lock.yaml`
- Modify: `app.json`
- Create: `eas.json`

- [ ] Add SDK-compatible packages with `npx expo install --fix` and `npx expo install expo-secure-store`.
- [ ] Keep npm as the single package manager and verify `npx expo-doctor` reports every check passing.
- [ ] Add iOS build number/export-compliance configuration, Android version code, notification and secure-store plugins, splash/background settings, and release EAS profiles.

## Task 2: Runtime configuration that fails closed

**Files:**
- Create: `src/api-config.test.ts`
- Create: `src/api-config.ts`
- Modify: `src/backend.ts`
- Create: `.env.example`

- [ ] Write tests for normalized `EXPO_PUBLIC_API_URL`, developer-host fallback, malformed URL rejection, and production missing-config rejection.
- [ ] Run `npm --prefix server exec tsx --test ./src/api-config.test.ts` and confirm the module-not-found failure.
- [ ] Implement `resolveApiBaseUrl({ configuredUrl, debuggerHost, isDev })` returning an `/api` URL or throwing a clear release error.
- [ ] Re-run the focused test and then the full suite.

## Task 3: Durable native authentication

**Files:**
- Create: `src/auth-session.test.ts`
- Create: `src/auth-session.ts`
- Modify: `src/auth.tsx`
- Modify: `src/backend.ts`

- [ ] Write tests proving save/read/delete behavior and cleanup after an invalid stored session.
- [ ] Run the focused test and confirm it fails because the session store does not exist.
- [ ] Implement the storage contract and use `expo-secure-store` on native plus localStorage on web.
- [ ] Make auth hydration await storage, remove invalid tokens, and never turn an expired token into the fallback demo user.

## Task 4: Safe account lifecycle

**Files:**
- Create: `server/src/routes/auth.test.ts`
- Modify: `server/src/routes/auth.ts`
- Modify: `server/src/lib/store.ts`
- Modify: `src/backend.ts`
- Modify: `src/auth.tsx`
- Create: `app/settings.tsx`
- Modify: `app/(tabs)/profile.tsx`

- [ ] Write API tests proving direct password replacement is unavailable and account deletion requires the current password.
- [ ] Confirm the tests fail against the existing reset endpoint and missing deletion endpoint.
- [ ] Remove the insecure reset mutation, expose a non-enumerating reset-request contract, and add authenticated password-confirmed deletion with transactional cleanup.
- [ ] Add a native settings surface for profile, language, notifications, legal/support, sign-out, and confirmed account deletion.

## Task 5: Contextual permissions and notification navigation

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `src/notifications.ts`
- Modify: `app/notifications.tsx`
- Modify: `app/(organizer)/scan.tsx`

- [ ] Add tests for notification URL validation and routing.
- [ ] Remove the launch-time permission prompt; request notifications only after reservation or from settings and camera only on scanner intent.
- [ ] Handle notification taps through allow-listed in-app routes and add retry/empty/permission states.

## Task 6: Honest checkout and recovery states

**Files:**
- Create: `src/checkout-readiness.test.ts`
- Create: `src/checkout-readiness.ts`
- Modify: `app/reserver/[id].tsx`
- Modify: `app/checkout/[sessionId].tsx`
- Modify: `server/src/routes/payments.ts`

- [ ] Test that paid checkout cannot claim completion without a configured provider and that free reservations remain available.
- [ ] Replace provider-demo copy with explicit availability/readiness states, retry, and safe back navigation.
- [ ] Keep ticket issuance server-authoritative and document the provider credentials required for a live submission.

## Task 7: Store-facing product surfaces

**Files:**
- Create: `app/legal.tsx`
- Create: `docs/PRIVACY.md`
- Create: `docs/TERMS.md`
- Create: `docs/STORE_SUBMISSION.md`
- Modify: `app/_layout.tsx`
- Modify: `README.md`

- [ ] Add readable privacy, terms, support, version, and data-deletion surfaces inside the app.
- [ ] Document data categories, retention/deletion, permissions, EAS environment variables, build commands, store metadata, reviewer accounts, and final manual device checks.

## Task 8: Verification and release evidence

**Files:**
- Modify: `package.json`
- Create: `docs/RELEASE_CHECKLIST.md`

- [ ] Run `npm run typecheck` and require zero errors.
- [ ] Run `npm run lint` and require zero new errors.
- [ ] Run `npm test` and `npm --prefix server test` and require all tests passing.
- [ ] Run `npx expo-doctor` and require all checks passing.
- [ ] Run `npx expo export --platform all --output-dir dist-release` and require a successful production bundle.
- [ ] Smoke-test onboarding, attendee auth, discovery, reservation, ticket QR, organizer auth, scan permission/manual fallback, settings, legal pages, sign-out, and account deletion.
