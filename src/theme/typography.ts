import type { TextStyle } from 'react-native';

/**
 * YoTicks type system.
 *
 * Two decisions drive the whole scale:
 *
 * 1. **The audience may not read comfortably.** Body copy is 16, not 13, and
 *    the body weight is 500 rather than 400 — at small sizes on cheap LCD
 *    panels a 400 weight loses too much stem contrast. Nothing meaningful is
 *    allowed below 12, and 12 is reserved for badges and counters that sit
 *    next to a larger label.
 *
 * 2. **Line height is part of the token, never guessed at the call site.**
 *    Previously screens set `fontSize` and left `lineHeight` undefined, so
 *    multi-line titles collapsed onto each other. Every role below ships a
 *    matched leading.
 *
 * Use `text.*` roles. `fontSize` / `fontFamily` remain exported because the
 * whole app already references them, and they are still the right primitives
 * for one-off numeric emphasis.
 */

const fontFamily = {
  /** Long-form paragraphs only. Prefer `medium` for UI copy. */
  regular: 'Poppins_400Regular',
  /** Default UI weight. */
  medium: 'Poppins_500Medium',
  /** Labels, buttons, emphasis. */
  semiBold: 'Poppins_600SemiBold',
  /** Headings and numbers. */
  bold: 'Poppins_700Bold',
} as const;

/**
 * Sizes stepped so adjacent roles are visibly different — the old scale had
 * 15 and 17 sitting next to each other, which reads as an accident.
 */
const fontSize = {
  /** Badges and counters only. Never a standalone label. */
  xs: 12,
  /** Meta, captions, chip text. */
  sm: 14,
  /** Body default. */
  base: 16,
  /** Emphasised body, list titles. */
  md: 18,
  /** Card titles, section headings. */
  lg: 20,
  /** Screen headings. */
  xl: 24,
  /** Hero headings. */
  '2xl': 30,
  /** Display numbers, gate states. */
  '3xl': 36,
} as const;

const lineHeight = {
  /** Headings — tight enough to group, loose enough to breathe. */
  tight: 1.15,
  /** Default. */
  snug: 1.35,
  /** Paragraphs. */
  relaxed: 1.55,
} as const;

const letterSpacing = {
  /** Large headings pull together slightly. */
  tight: -0.4,
  normal: 0,
  /** Uppercase eyebrows and overlines. */
  wide: 1.2,
} as const;

function role(
  family: string,
  fontSizeValue: number,
  leading: number,
  spacing: number = letterSpacing.normal,
  extra?: Pick<TextStyle, 'textTransform'>,
): TextStyle {
  return {
    fontFamily: family,
    fontSize: fontSizeValue,
    lineHeight: Math.round(fontSizeValue * leading),
    letterSpacing: spacing,
    ...extra,
  };
}

/**
 * Semantic roles. A screen should reach for one of these before it reaches
 * for `fontSize` directly.
 */
const text = {
  /** One per screen. The thing the user came for. */
  display: role(fontFamily.bold, fontSize['3xl'], lineHeight.tight, letterSpacing.tight),
  /** Screen title. */
  title: role(fontFamily.bold, fontSize.xl, lineHeight.tight, letterSpacing.tight),
  /** Section heading. */
  heading: role(fontFamily.bold, fontSize.lg, lineHeight.snug),
  /** Card and list-row title. */
  subheading: role(fontFamily.semiBold, fontSize.md, lineHeight.snug),
  /** Default paragraph. */
  body: role(fontFamily.medium, fontSize.base, lineHeight.relaxed),
  /** Long-form description. */
  paragraph: role(fontFamily.regular, fontSize.base, lineHeight.relaxed),
  /** Supporting line under a title. */
  meta: role(fontFamily.medium, fontSize.sm, lineHeight.snug),
  /** Form labels, chips, tabs. */
  label: role(fontFamily.semiBold, fontSize.sm, lineHeight.snug),
  /** Button text. */
  action: role(fontFamily.semiBold, fontSize.base, lineHeight.snug),
  /** Uppercase overline above a heading. Always paired with a real title. */
  eyebrow: role(fontFamily.semiBold, fontSize.xs, lineHeight.snug, letterSpacing.wide, {
    textTransform: 'uppercase',
  }),
  /** Badge and counter text. */
  caption: role(fontFamily.semiBold, fontSize.xs, lineHeight.snug),
  /** Big count. Tabular so digits do not jitter as values refresh. */
  number: {
    ...role(fontFamily.bold, fontSize.xl, lineHeight.tight, letterSpacing.tight),
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },
  /** Gate verdict: ENTRÉ / BLOQUÉ. Read across a metre in a dark doorway. */
  verdict: role(fontFamily.bold, fontSize['3xl'], lineHeight.tight, letterSpacing.tight),
} satisfies Record<string, TextStyle>;

export const typography = {
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  text,
} as const;

export type TextRole = keyof typeof text;
