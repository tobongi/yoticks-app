# YoTicks Visual System

## Theme

YoTicks uses a warm ticketing system built for speed and legibility.

- Backgrounds are soft and warm, not pure white.
- Cards are bright, simple, and tactile.
- Orange is the main accent.
- Green is reserved for success and valid entry states.
- Black/ink anchors important actions and navigation.

## Tokens

### Color

- `colors.bgDeep`: warm app canvas
- `colors.card`: primary surface
- `colors.cardStrong`: raised soft surface
- `colors.orange`: primary action + highlight
- `colors.green`: success / valid state
- `colors.red`: blocked / destructive state
- `colors.text`: primary text
- `colors.textSecondary`: secondary copy
- `colors.textMuted`: low-emphasis support text

Rules:

- Prefer existing color tokens over new raw values.
- Use one accent color per screen where possible.
- Use red and green only for true status meaning.

## Typography

- Headlines: bold, short, count-first.
- Body: keep to the shortest usable sentence.
- Captions: support only, never the main communication path.

Rules:

- Avoid long multi-line intros.
- Avoid decorative letter spacing unless already part of the tokenized style.
- Use larger numeric emphasis for counts, progress, and gate states.

## Spacing

- Small: 8
- Base: 12 to 16
- Section: 18 to 24
- Hero separation: 24+

Rules:

- Interactive elements should feel chunky and easy to hit.
- Dense information should still breathe through card grouping, not large paragraphs.

## Components

### Hero panels

- Big title
- Short subtitle
- Strong action
- Optional stat row

### Visual cards

- Image or clear visual anchor
- Title
- One short meta line
- One compact badge

### Action tiles

- Icon
- 1 to 2 word label
- Optional one-line hint

### Status blocks

- Number first
- Label second
- Progress third

## Accessibility

- Touch targets should be at least 48x48.
- Icon-only controls must expose labels.
- Empty states must include one obvious next action.
- Contrast should favor strong readability over visual subtlety.

## Redesign Intent

This app should feel like a real ticketing tool people use under pressure, not a demo app. Every screen should reduce hesitation, shorten reading time, and help users act with confidence.
