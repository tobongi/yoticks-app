# App Redesign Notes

## Goal

The app now favors:

- short labels over explanatory paragraphs
- icon-first actions
- count-first status blocks
- warmer backgrounds and layered cards so the product feels more lived in

## Rules

- A screen should reveal its main action in the first viewport.
- Numbers, status, and place come before descriptive copy.
- Reusable cards and chips should keep attendee and organizer flows visually related.

## Shared building blocks

- `src/ui/lived-in.tsx`
- `src/app-redesign.ts`
- `PRODUCT.md`
- `DESIGN.md`

## Process

The redesign is now informed by:

- Impeccable getting-started guidance for product/design context
- the local `ui-design-system` skill for token and system discipline
- the local `baseline-ui` skill for touch targets, accessibility, and anti-slop constraints

## Verification

- `npx tsc --noEmit`
- `npm exec tsx --test src/app-redesign.test.ts`
- `npm --prefix server test`
