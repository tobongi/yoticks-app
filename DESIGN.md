# YoTicks Visual System

The product this serves is described in `PRODUCT.md`. Read that first — the
constraints there (low literacy, cheap devices, people in a queue) are the
reason for almost every decision below.

## Direction

**Warm signage, not soft SaaS.** The references are transport wayfinding,
festival wristbands, and point-of-sale terminals: high contrast, few words,
big targets, one obvious action. Ink anchors the page, a single orange
carries action, green and red mean only "valid" and "blocked".

What that rules out, explicitly:

- Decorative blur orbs and background gradients.
- Shadows used as decoration rather than to express height.
- More than one accent colour competing on a screen.
- Any text under 12pt, and 12pt only for counters beside a larger label.
- Colour as the sole carrier of meaning.

## Tokens

Everything numeric comes from `src/theme/tokens.ts`. Screens should not
invent values; the audit that preceded this system found 14 distinct
paddings and 9 corner radii in use simultaneously.

### Spacing — `space`

4pt grid. `md` (12) inside a component, `lg` (16) between components,
`xl` (24) between sections.

### Radius — `radius`

`sm` 10 · `md` 14 · `lg` 18 · `xl` 24 · `xxl` 28 · `pill` 999.

**Rule:** a child's radius is its parent's radius minus the padding between
them, so nested corners stay concentric. `radius.lg - space.sm === radius.sm`
is asserted in `tokens.test.ts`.

### Size — `size`

`touchMin` is 48 and is the floor for anything tappable. Controls step
44 / 52 / 58. Primary actions on a phone use 58 — sized for a thumb on a
one-handed device.

### Elevation — `shadows.ts`

Five levels: `flat`, `sm`, `md`, `lg`, `xl`. All tinted with the canvas's
own brown (`#3A2A1E`) rather than neutral grey, which over a warm background
produced a muddy halo. Cards use `sm`. Nothing on a page body uses more than
`md`. If two things need separating and neither is floating, use a border.

### Motion — `duration`

`instant` 90 · `fast` 160 · `medium` 240 · `slow` 320. Nothing animates for
longer than 320ms. This app is used standing up.

## Colour

`src/theme/colors.ts`, two layers: `palette` holds raw ramps and is never
used by screens; `colors` holds semantic roles and is what components import.

### The one rule that matters

**Each accent has a fill form and an ink form. They are not interchangeable.**

| Role | Fill (backgrounds) | Ink (text and icons) |
|---|---|---|
| Accent | `colors.orange` | `colors.orangeInk` |
| Valid | `colors.green` | `colors.greenInk` |
| Blocked | `colors.red` | `colors.redInk` |
| Info | `colors.blue` | `colors.blueInk` |

Brand orange on white is **3.15:1** — below the 4.5:1 AA floor. It shipped as
the category label on every card in the app until this pass. Use `orangeInk`
(5.2:1) for any orange that is text. The same applies to green: the button
fill is `greenInk`, because `green` on white is only 3.85:1.

### Text

`text` for content, `textSecondary` for support, `textMuted` for the least
emphasis. All three clear AA on every surface they are allowed to appear on —
`textMuted` is tuned against `surfaceSunken`, the darkest of them, not
against white.

### Guarantees

`src/theme/colors.test.ts` asserts every foreground/background pairing the
app ships. Adding a token means adding it to that table. The maths lives in
`src/theme/contrast.ts` and is itself tested against the WCAG reference
values.

## Type

`src/theme/typography.ts`. Use the semantic roles in `typography.text`
before reaching for `fontSize` directly.

`display` · `title` · `heading` · `subheading` · `body` · `paragraph` ·
`meta` · `label` · `action` · `eyebrow` · `caption` · `number` · `verdict`

Two decisions worth knowing:

- **Body is 16 and weight 500**, not 13 and weight 400. At small sizes on
  cheap LCD panels a 400 weight loses too much stem contrast for readers who
  are not fluent.
- **Line height is baked into every role.** Screens used to set `fontSize`
  and leave `lineHeight` undefined, which collapsed multi-line titles.

`number` and `verdict` are tabular so digits do not jitter as counts refresh.

## Layout

`src/ui/responsive-core.ts` — three size classes: `compact` (phones),
`medium` (≥600), `expanded` (≥1024).

**Content always sits in a centred column with a real maximum width.**
`contentMaxWidth` is 620 for the app column, `wideMaxWidth` 1080 for
organiser tables. Before this existed the web build stretched a phone layout
across the whole browser — on a 1440px window the primary button rendered
1440px wide, anchored at x=0. `responsive.test.ts` guards against that
returning.

Derived sizes (posters, QR codes) are computed from the **column**, not the
viewport, so a 2560px monitor does not produce a 2400px poster.

### The screen shell

Wrap every screen in `<Screen>` from `src/ui/screen.tsx`. It owns the canvas,
safe-area insets, the centred column, the section rhythm, and the bottom
inset that keeps the last card clear of the floating tab bar.

- `footer` — a sticky action bar, bounded to the same column.
- `bleed` — no tab-bar inset, for screens without one.
- `wide` — organiser column.
- `scroll={false}` — screens that manage their own scrolling.

`CenteredColumn` applies the same measure to fixed chrome outside `Screen`.

## Components

`src/ui/lived-in.tsx` is the kit; `src/ui/form.tsx` holds inputs.

Structure — `ScreenHeader` `HeroPanel` `SectionBlock` `Card` `Divider`
Actions — `Button` `PrimaryAction` `ActionTile` `Chip` `Badge`
Content — `StatRow` `VisualCard` `MetaPill` `ProgressBar` `InlineScroll`
States — `Skeleton` `SkeletonCard` `EmptyState` `ErrorState`
Forms — `Input` `SegmentedControl` `ToggleRow`

### Every state is required

Default, hover, pressed, **focus**, disabled, loading, empty, error. Focus in
particular: the web build was previously impossible to operate from a
keyboard because every control was a bare `Pressable`. `src/ui/interaction.ts`
provides `useInteraction` and `focusRingStyle` — use them on anything
pressable. The ring is drawn as an outline, not a border, so it never shifts
the layout.

### Loading and failure

Screens used to render hard-coded demo data while their real request was in
flight and had no `.catch()` at all, so a failed request left fictional
events on screen indefinitely. Use `SkeletonCard` while loading and
`ErrorState` with a retry on failure. Never present fallback data as though
it were real.

### HeroPanel

The panel's title runs the full width. Decorative art shares the top row with
the eyebrow — it previously sat beside the title and squeezed a 30px heading
into a 157pt column, wrapping four lines.

## Accessibility

- 48×48 minimum touch target (`size.touchMin`).
- Every interactive element has an accessible name; icon-only controls carry
  an explicit `accessibilityLabel`.
- Colour never carries meaning alone — pair it with a label, an icon, a
  count, or a filled surface. The active tab has a tinted pill, not just a
  tint.
- Form fields keep a persistent visible label. A placeholder is not a label:
  it disappears on first keystroke and is not an accessible name.
- Errors are announced (`accessibilityRole="alert"`), not only coloured.
- Empty states always offer one obvious next action.

## Data freshness

`src/live-refresh.ts` exposes named cadences: `REFRESH.live` (4s),
`REFRESH.normal` (30s), `REFRESH.slow` (60s). Screens previously hard-coded
2500ms — roughly 1,440 requests an hour per open screen, running even in a
hidden tab. That is a real cost on a prepaid data plan. Polling now suspends
while the app is backgrounded and fires once on return, so perceived
freshness is unchanged.

Use `live` only for something the user is actively waiting on: a payment
confirming, a gate scanning.

## Dark mode

`darkColors` in `colors.ts` is complete and contrast-tested, but **is not yet
wired to a runtime switch**. Every screen builds its styles with a
module-scope `StyleSheet.create`, which cannot react to a theme change;
enabling dark mode means moving those to a `useThemedStyles` hook across all
33 routes. The palette is kept in lockstep so that migration is mechanical
rather than a fresh colour exercise. Do not ship a partial dark mode — a
half-themed app is worse than a well-made light one.

## Redesign intent

This app should feel like a real ticketing tool people use under pressure,
not a demo. Every screen should reduce hesitation, shorten reading time, and
help someone act with confidence. When a decision is close, choose the option
that works for a tired person, in a queue, on a cheap phone, in the dark.
