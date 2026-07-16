# App Store Submission Guide

## Release scope

The release candidate supports attendee onboarding, account creation/login/recovery/deletion, event discovery/search/saving, free-ticket reservation, QR wallet/detail, local reminders, organizer event operations, and camera/manual check-in. Paid checkout is fail-closed: `EXPO_PUBLIC_ENABLE_PAID_CHECKOUT` remains `false` until a production payment provider confirms payment server-side. The API independently returns HTTP 402 if a paid tier is sent to the free reservation endpoint.

## Required production configuration

Set these as EAS/hosting secrets or environment variables; never commit their values:

- `EXPO_PUBLIC_API_URL`: public HTTPS backend origin. The app refuses a missing or HTTP production endpoint.
- `EXPO_PUBLIC_SUPPORT_EMAIL`: monitored support/privacy mailbox.
- `EXPO_PUBLIC_ENABLE_PAID_CHECKOUT`: `false` for the initial free-ticket release; only `true` after provider-confirmation tests pass.
- `PAID_CHECKOUT_ENABLED`: server-side payment kill switch. Production startup validates the complete webhook configuration before accepting `true`.
- `MBIYOPAY_API_KEY`: server-only provider credential.
- `MBIYOPAY_WEBHOOK_SECRET`: server-only HMAC signature secret configured identically in the provider dashboard.
- `MBIYOPAY_WEBHOOK_URL`: canonical public HTTPS callback ending in `/api/payments/mobile-money/webhook`.
- `JWT_SECRET`: at least 32 random characters. Production startup fails without it.
- `CORS_ORIGINS` and `CLIENT_URL`: exact production web origins. Wildcard Vercel origins are not accepted.
- `PASSWORD_RESET_WEBHOOK_URL`: HTTPS automation/email endpoint accepting `{to,name,resetUrl,expiresInMinutes}`. Production startup fails without it.
- `PASSWORD_RESET_DEEP_LINK_BASE`: `yoticks://auth/reset`.
- `DATABASE_URL`: managed production database connection supported by the chosen deployment schema.

Before enabling either paid-checkout switch, run `npm run payments:webhook:check` against the deployed host and complete a signed sandbox payment with the app closed. The ticket must be issued exactly once by the webhook and appear after the next app launch. A 404, 401 readiness request, non-HTTPS URL, alias callback path, or unsigned success response blocks paid release.

## EAS setup and builds

```bash
npm ci
npx expo-doctor
npm run verify
npx eas-cli login
npx eas-cli init
npx eas-cli build --profile preview --platform all
npx eas-cli build --profile production --platform ios
npx eas-cli build --profile production --platform android
```

`eas init` writes the project ID owned by the actual Expo account; it cannot be safely invented in source control. `eas.json` already defines development, internal preview, and auto-incrementing production profiles.

## Store records

- App name: YoTicks
- Bundle/package ID: `com.yoticks.app`
- Category: Entertainment / Events
- Support contact: `support@yoticks.app`
- Privacy policy: publish `docs/PRIVACY.md` at a public HTTPS URL and use that URL in both stores.
- Terms: publish `docs/TERMS.md` at a public HTTPS URL.
- Account deletion: Profile → Settings → Delete my account.
- Camera purpose: organizer-only QR ticket scanning with manual code entry as fallback.
- Notifications purpose: ticket confirmations and user-requested event reminders; the prompt is contextual, not on launch.
- Encryption declaration: only exempt OS/network encryption (`usesNonExemptEncryption: false`).
- Tracking: none (`NSPrivacyTracking: false`).

## Review access

Create fresh, non-production reviewer accounts in the review backend: one attendee and one organizer with a published free event and two tickets (one valid, one used). Do not expose `/auth/dev-login`; the route returns 404 in production.

## Mandatory real-device checks

Use an iPhone on iOS 16.4+ and an Android device on Android 7+ for the full checklist in `docs/RELEASE_CHECKLIST.md`. Notification-launch behavior must be tested with a release build because Expo documents a debug-build Android splash issue. Camera scanning, secure session restoration, deep-link password reset, account deletion, accessibility font scaling, offline recovery, and both light/dark system settings require physical-device evidence before submission.
