/**
 * Primitive design tokens: the numeric vocabulary of the interface.
 *
 * Before this existed the app used 14 different paddings, 9 corner radii, and
 * no motion timings at all. Every value below is deliberate and every screen
 * is expected to pick from these instead of inventing a number.
 */

/**
 * 4pt spacing scale. `md` (12) is the default gap inside a component,
 * `lg` (16) between components, `xl` (24) between sections.
 */
export const space = {
  none: 0,
  /** Hairline separation, icon-to-label. */
  xxs: 2,
  /** Tight pairing: label above value. */
  xs: 4,
  /** Related items inside one block. */
  sm: 8,
  /** Default gap inside a component. */
  md: 12,
  /** Gap between components. */
  lg: 16,
  /** Gap between sections. */
  xl: 24,
  /** Major separation, above a section heading. */
  xxl: 32,
  /** Screen top/bottom breathing room. */
  xxxl: 48,
} as const;

/**
 * Corner radii. The rule: a child's radius is the parent's radius minus the
 * padding between them, so concentric corners stay parallel. `pill` is only
 * for fully-rounded chips, badges, and progress tracks.
 */
export const radius = {
  none: 0,
  /** Inputs inside a card, small swatches. */
  sm: 10,
  /** Buttons, inputs, list rows. */
  md: 14,
  /** Cards, tiles. */
  lg: 18,
  /** Sheets, hero surfaces, modals. */
  xl: 24,
  /** Full-bleed feature panels. */
  xxl: 28,
  /** Chips, badges, avatars, tracks. */
  pill: 999,
} as const;

/**
 * Minimum interactive sizes. 48 is the WCAG 2.2 target-size floor and the
 * default for anything tappable; 56 is the primary action on a phone, sized
 * for a thumb held one-handed in a queue.
 */
export const size = {
  /** Inline icon next to text. */
  iconSm: 16,
  /** Standard control icon. */
  iconMd: 20,
  /** Standalone navigation icon. */
  iconLg: 24,
  /** Pictogram inside a tile. */
  iconXl: 40,
  /** WCAG 2.2 minimum touch target. */
  touchMin: 48,
  /** Secondary / inline control height. */
  controlSm: 44,
  /** Default control height. */
  controlMd: 52,
  /** Primary action height. */
  controlLg: 58,
  /** Bottom tab bar. */
  tabBar: 68,
} as const;

/** Stroke widths. `hairline` is a border, `focus` is the keyboard ring. */
export const stroke = {
  hairline: 1,
  medium: 2,
  focus: 3,
} as const;

/**
 * Motion. Deliberately short: this app is used standing up, in a queue, on a
 * slow device. Animation confirms an action, it never makes anyone wait.
 */
export const duration = {
  /** Press feedback, colour change. */
  instant: 90,
  /** Default enter/exit. */
  fast: 160,
  /** Sheets, expanding panels. */
  medium: 240,
  /** Full-screen transitions only. */
  slow: 320,
} as const;

/** Stacking order, so overlays never fight each other. */
export const layer = {
  base: 0,
  raised: 1,
  sticky: 10,
  header: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;

/** Opacity for non-interactive and pressed states. */
export const opacity = {
  disabled: 0.4,
  pressed: 0.88,
  scrim: 0.6,
} as const;

export type Space = keyof typeof space;
export type Radius = keyof typeof radius;
