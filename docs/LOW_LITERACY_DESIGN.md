# YoTicks Low-Literacy Interface Standard

YoTicks is designed so that reading supports recognition instead of carrying the entire task. The ticket is the attendee's main object; the scanner is the organizer's main instrument.

## Non-negotiable rules

1. Lead with a concrete object: event photo, ticket, map pin, person, camera frame, or status seal.
2. Pair every unfamiliar pictogram with one short verb or noun. Never use color or an icon as the only signal.
3. Put one dominant action in the thumb zone. Secondary actions use labelled visual tiles.
4. Keep touch targets at least 48 x 48 logical pixels with visible pressed, disabled, loading, success, and error states.
5. Keep form labels visible. Payments, account deletion, identity, legal terms, and recovery steps may use more text because removing meaning would be unsafe.
6. Use progressive disclosure: show the next decision, not the entire process.
7. Use warm ivory, near-black, orange, green, cobalt, yellow, and red consistently, but always repeat status with shape, pictogram, and words.
8. Never autoplay speech. Tap-to-hear stops queued speech before reading a short French instruction at a measured rate.

## Visual dictionary

| Meaning | Object | Tone | Short label |
| --- | --- | --- | --- |
| Find an event | Magnifier | Orange | Trouver |
| My tickets | Ticket stub and QR | Blue | Mes QR |
| Scan at the gate | Framed QR | Green | Scanner |
| Nearby | Folded map and pin | Yellow | Près de moi |
| Valid ticket | Check seal | Green | Prêt |
| Already used | Clock seal | Yellow/ink | Déjà passé |
| Cancelled or refused | Block seal | Red | Bloqué |
| Unknown ticket | Question seal | Red | Inconnu |
| Spoken help | Speaker waves | Blue | Écouter |

Event categories have their own concrete scenes: notes for music, speech bubbles for talks, a moon for nightlife, a ball for sport, people for meetups, framed art for exhibitions, and a graduation cap for workshops. The mappings live in `src/ui/visual-language.ts`; the original SVG drawings live in `src/ui/pictograms.tsx`.

## Writing rules

- Prefer one- or two-word labels and direct verbs: `Trouver`, `Scanner`, `Montre`, `Continuer`.
- Put the action first. Avoid introductions, jargon, idioms, and marketing copy inside a task.
- Use no more than two short lines for guidance unless the content is legal or safety-critical.
- Keep dates, prices, locations, holder names, ticket codes, and destructive consequences explicit.
- Do not replace difficult words with unexplained symbols. A concrete symbol and a short label work together.

## Spoken guidance

The optional speaker control is used on onboarding, ticket presentation, and organizer scanning. It uses Expo Speech with `fr-FR`, a slightly slower rate, interruption of queued speech, and explicit speaking state. Expo documents that iOS physical devices do not produce speech while silent mode is enabled, so release testing must turn silent mode off.

## Accessibility and validation

- Every actionable pictogram exposes a button role, accessible name, state, and at least a 48px target.
- Decorative SVGs are hidden from accessibility APIs; meaningful SVGs receive a concise label.
- Focus order follows the visible task order. Status never depends on hue alone.
- Verify VoiceOver, TalkBack, 200% text, reduced motion, camera denial, offline/error states, and one-handed operation.
- Before release, test the pictogram vocabulary with at least five first-time participants from the target audience. Ask each person to complete discovery, reservation, ticket retrieval, and ticket presentation without coaching. Record misidentifications and replace the pictogram or flow. Do not solve pictogram failure by adding a paragraph.

## Design-source policy

Mobbin's public pattern taxonomy and 21st.dev's empty-state, card, and navigation patterns informed the information architecture. The production interface does not copy proprietary screens or web-only effects. YoTicks uses original React Native SVG artwork, native interaction patterns, existing event photography, and a product-specific ticket-stub/street-event visual language.
