# YoTicks Privacy Notice

Effective: 13 July 2026

YoTicks operates the YoTicks event-discovery, ticketing, and event-entry application. Questions and privacy requests can be sent to `support@yoticks.app`.

## Data we process

- Account data: name, email address, password hash, account role, and optional profile image.
- Ticketing data: saved events, reservations, tickets, ticket status, gate assignment, purchase amount, waitlist entries, and merchant onboarding details for organizers.
- Product activity: selected city and categories, search history, followed organizers/categories, event interactions, and notification read state.
- Device permissions: camera access is used only while an organizer chooses to scan a QR code. Notification access is requested only after a user asks for reminders or confirms a reservation.
- Operational data: standard server security logs needed to prevent abuse, diagnose failures, and protect accounts.

YoTicks does not sell personal data and does not use cross-app advertising tracking.

## Why we process it

We process this data to create and secure accounts, show relevant events, issue and retrieve tickets, validate admission, operate organizer tools, send requested service messages, prevent fraud, and provide support. Where consent is required for a device permission, the operating system prompt records that choice and the app remains usable through the available manual path.

## Sharing

Data is shared only with infrastructure and delivery providers needed to run YoTicks, with the organizer responsible for an event when needed to issue or validate admission, or when required by law. Providers must process data for the contracted service and protect it appropriately.

## Retention and deletion

Account data is retained while the account is active. A user can permanently delete their account in **Profile → Settings → Delete my account**. Deletion removes the account and its tickets, favorites, notifications, search history, follows, interactions, waitlist entries, checkout sessions, and merchant records. Events created by an organizer are retained as event records but are dissociated from the deleted account. Security backups and logs expire under the infrastructure retention schedule.

## Security

Passwords are stored as bcrypt hashes. Mobile session tokens are stored in iOS Keychain or Android Keystore-backed encrypted storage. Production API traffic must use HTTPS. Authentication endpoints are rate-limited, password recovery uses a hashed single-use token that expires after 30 minutes, and paid tickets cannot be issued without server-side payment verification.

## Your choices and rights

Users can edit their profile, change language, refuse camera or notification access, sign out, and delete the account in the app. Requests for access, correction, portability, restriction, or objections can be sent to `support@yoticks.app`. Identity verification may be required before fulfilling a request.

## Children

YoTicks is not directed to children below the minimum digital-consent age in their country. Organizers are responsible for clearly stating age restrictions for their events.

## Changes

Material changes will be reflected by a new effective date and, when appropriate, an in-app notice.
