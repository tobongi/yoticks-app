# Low-Literacy Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn every YoTicks attendee and organizer screen into a premium, text-light, pictogram-led experience that remains accessible and safe for low-literacy users.

**Architecture:** Put the visual language in shared tested primitives rather than duplicating styling across routes. Pure helpers define concrete event/status/action semantics; SVG illustrations render those semantics; shared cards, headers, buttons, empty states, and navigation propagate the system across the app. High-risk forms retain short persistent labels and explicit confirmation.

**Tech Stack:** Expo 56, React Native 0.85, Expo Router, react-native-svg, TypeScript, Node test runner.

---

## UX decision brief

- Job: find an event, recognize it, reserve safely, retrieve the QR, or scan a guest with minimal reading.
- User mode: first-time and returning attendees with low literacy; organizers under time pressure at the gate.
- Frequency/risk: frequent browsing, occasional ticket purchase, high-impact payment and gate decisions.
- Pattern: visual object stage + one thumb action + progressive disclosure.
- Primary action: one large icon-and-verb control per screen.
- Secondary actions: concrete icon tiles, visual filters, and compact labelled rows.
- Core path: see object -> tap concrete action -> immediate visual feedback -> ticket or scan success.
- Recovery path: red/amber/green medallion plus icon, short phrase, and one repair action.
- Required states: loading skeleton, illustrated empty, error/retry, permission, success, unavailable, used.
- Handoff constraints: never rely on an icon or color alone; retain labels and accessibility descriptions; minimum 48px targets.

## UI decision brief

- Surface type: cross-platform native mobile task flow.
- Product thesis: the ticket is the main object; the gate scanner is the organizer instrument.
- Originality seed: a vibrant Congolese event street, ticket-stub geometry, venue-light halos, and stamped status seals.
- Composition archetype: object-detail stage for attendees; instrument panel for organizers.
- Typography personality: Poppins bold for recognition, short medium labels, no paragraph-led hierarchy.
- Visual direction: warm ivory, near-black, hot orange, fresh green, cobalt support color; strong photography and layered SVG pictograms.
- Density: balanced attendee surfaces; operational organizer surfaces.
- Hierarchy: main object, primary action, then short visual choices.
- Motion budget: subtle/functional; press, state, scan feedback only; reduced-motion safe.
- Asset plan: original react-native-svg scenes and pictograms; existing event photography; no copied Mobbin/21st.dev assets.
- Bans: icon-only ambiguity, long instructional paragraphs, tiny chips, generic card grids, ornamental glass, color-only status, hidden destructive actions.

## Task 1: Semantic visual language

**Files:**
- Create: `src/ui/visual-language.test.ts`
- Create: `src/ui/visual-language.ts`

- [ ] Write failing tests for event-category, ticket-state, and action visual mappings.
- [ ] Run `npm --prefix server exec tsx --test ./src/ui/visual-language.test.ts` and confirm missing-module failure.
- [ ] Implement deterministic mappings with concrete pictogram keys, tones, and one/two-word French labels.
- [ ] Rerun the focused test and confirm PASS.

## Task 2: Premium SVG system and shared primitives

**Files:**
- Create: `src/ui/pictograms.tsx`
- Modify: `src/icons.tsx`
- Modify: `src/ui/lived-in.tsx`
- Modify: `src/theme/colors.ts`
- Modify: `src/theme/typography.ts`

- [ ] Add layered SVG category scenes, ticket art, status seals, empty-state art, and action glyphs.
- [ ] Upgrade headers, hero stages, action tiles, chips, cards, progress, buttons, and illustrated states with 48px targets and accessibility labels.
- [ ] Preserve short text alongside unfamiliar icons and never encode status using color alone.

## Task 3: Attendee discovery and wallet

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/search.tsx`
- Modify: `app/(tabs)/tickets.tsx`
- Modify: `app/(tabs)/profile.tsx`
- Modify: `app/event/[id].tsx`
- Modify: `app/ticket/[id].tsx`

- [ ] Make home photography-led with visual category controls and one dominant event action.
- [ ] Make search a pictogram/category surface before typing.
- [ ] Make the wallet a recognizable ticket stack with QR-first active state.
- [ ] Convert event/ticket detail metadata into date, place, price, and status pictogram rows.

## Task 4: Onboarding, auth, settings, and support

**Files:**
- Modify: `app/onboarding.tsx`
- Modify: `app/platform.tsx`
- Modify: `app/auth/login.tsx`
- Modify: `app/auth/register.tsx`
- Modify: `app/auth/reset.tsx`
- Modify: `app/settings.tsx`
- Modify: `app/legal.tsx`
- Modify: `app/notifications.tsx`

- [ ] Reduce onboarding to visual outcomes, skip/resume, and concrete interest/location choices.
- [ ] Keep persistent form labels but replace explanatory copy with icon examples and short prompts.
- [ ] Convert settings/legal/notifications into grouped visual rows with illustrated states and consistent help placement.

## Task 5: Reservation and checkout

**Files:**
- Modify: `app/reserver/[id].tsx`
- Modify: `app/checkout/[sessionId].tsx`

- [ ] Stage the selected ticket visually, simplify quantity/tier/payment choices, and show a pictorial review before confirmation.
- [ ] Retain explicit amount, provider, and risk language because money decisions must not be icon-only.
- [ ] Make provider unavailable/error/success states visually distinct with one recovery action.

## Task 6: Organizer command surfaces

**Files:**
- Modify: `app/(organizer)/_layout.tsx`
- Modify: `app/(organizer)/index.tsx`
- Modify: `app/(organizer)/events.tsx`
- Modify: `src/organizer/event-manager.tsx`
- Modify: `app/(organizer)/tickets.tsx`
- Modify: `src/organizer/ticket-detail.tsx`
- Modify: `app/(organizer)/scan.tsx`
- Modify: `app/(organizer)/cities/index.tsx`
- Modify: `app/(organizer)/cities/[slug].tsx`

- [ ] Promote Scan to the dominant control and render gate outcomes as oversized icon + word + next action.
- [ ] Convert operational lists to photo/pictogram rows and status seals.
- [ ] Keep editor labels and validation explicit while making modes, image choice, and publish state visual.

## Task 7: Organizer account and business screens

**Files:**
- Modify: `app/(organizer)/profile.tsx`
- Modify: `app/(organizer)/payouts.tsx`
- Modify: `app/(organizer)/brand-kit.tsx`
- Modify: `app/(organizer)/support.tsx`

- [ ] Replace paragraph-led cards with concrete account, money, brand, and help pictogram groups.
- [ ] Preserve complete merchant/legal field labels and error guidance.

## Task 8: Documentation and verification

**Files:**
- Modify: `README.md`
- Modify: `docs/RELEASE_CHECKLIST.md`
- Create: `docs/LOW_LITERACY_DESIGN.md`
- Modify: `package.json`

- [ ] Document the pictogram system, text rules, audio-ready affordances, cultural validation requirement, and accessibility contract.
- [ ] Add focused visual-language tests to the root test script.
- [ ] Run `npm run verify` and require typecheck, lint, every test, Expo Doctor, all-platform export, and server build to pass.
- [ ] Inspect representative attendee and organizer screens at narrow and wide phone widths; correct clipping, ambiguity, and undersized targets.
