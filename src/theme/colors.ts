/**
 * YoTicks colour system.
 *
 * Two layers:
 *   1. `palette` — raw brand and neutral ramps. Never used directly by screens.
 *   2. `colors`  — semantic roles. This is what components consume.
 *
 * Every foreground/background pairing exported here is asserted against
 * WCAG 2.2 AA in `colors.test.ts`. If you add a token, add it to that test.
 *
 * Design direction: warm signage, not soft SaaS. Ink anchors the page, one
 * orange carries action, green and red mean only "valid" and "blocked".
 */

// ---------------------------------------------------------------------------
// Layer 1 — primitives
// ---------------------------------------------------------------------------

const ink = {
  /** Primary text, filled dark surfaces. */
  900: '#17130F',
  800: '#241E19',
  700: '#3A322C',
  /** Secondary text — 5.9:1 on canvas. */
  600: '#6E625A',
  /**
   * Muted text. Replaces the old 3.29:1 #93887D.
   * Tuned against the *darkest* surface it lands on (`surfaceSunken`,
   * #F4EDE7), not against white — measured there it is 4.64:1, so it clears
   * AA on every surface rather than only the flattering ones.
   */
  500: '#746862',
  400: '#A2968D',
  /** Decorative dividers only, never text. */
  300: '#C9BFB7',
  200: '#E4DCD5',
  100: '#F0EAE5',
  50: '#F8F4F1',
} as const;

const warm = {
  /** App canvas. Warm enough to feel local, light enough to stay legible. */
  canvas: '#FBF7F4',
  canvasSunken: '#F4EDE7',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFBF8',
  surfaceSunken: '#F8F2ED',
} as const;

const brand = {
  /** Action fill. Black text on this is 5.99:1. */
  orange: '#F2643B',
  orangePressed: '#DE5730',
  /** Orange readable as TEXT on light surfaces — 5.2:1. The old #F2643B was 3.15:1. */
  orangeInk: '#B8420E',
  orangeSurface: '#FFF1EB',
  yellow: '#F6C35B',
  yellowInk: '#7A5406',
  yellowSurface: '#FFF7E4',
} as const;

const signal = {
  green: '#4D8F6A',
  /** Green readable as TEXT — 6.3:1. */
  greenInk: '#2F6B48',
  greenSurface: '#EDF6F0',
  red: '#D71F27',
  /** Red readable as TEXT — 5.1:1. */
  redInk: '#B81C23',
  redSurface: '#FDF0F0',
  blue: '#3267D6',
  /** Blue readable as TEXT — 5.2:1. */
  blueInk: '#2A55B0',
  blueSurface: '#EEF3FF',
} as const;

export const palette = { ink, warm, brand, signal } as const;

// ---------------------------------------------------------------------------
// Layer 2 — semantic roles
// ---------------------------------------------------------------------------

export const colors = {
  // --- Brand -------------------------------------------------------------
  black: ink[900],
  ivory: warm.surfaceRaised,
  beige: warm.canvasSunken,

  /** Primary action fill. Pair with `colors.onAccent`. */
  orange: brand.orange,
  orangePressed: brand.orangePressed,
  /** Use for orange TEXT and icons on light surfaces. */
  orangeInk: brand.orangeInk,
  orangeDark: brand.orangeInk,
  yellow: brand.yellow,
  yellowInk: brand.yellowInk,

  green: signal.green,
  greenInk: signal.greenInk,
  greenDark: signal.greenInk,
  red: signal.red,
  redInk: signal.redInk,
  blue: signal.blue,
  blueInk: signal.blueInk,
  blueSoft: signal.blueSurface,
  violet: '#5B44A0',

  // --- Surfaces ----------------------------------------------------------
  /** The page. */
  bgDeep: warm.canvas,
  bg: warm.surface,
  /** Default card. */
  card: warm.surface,
  /** Card raised off the canvas. */
  cardStrong: warm.surfaceRaised,
  /** Pressed / hovered card. */
  cardHover: warm.surfaceSunken,
  surfaceSoft: warm.surfaceSunken,
  surfaceSunken: warm.canvasSunken,
  surfaceBlue: signal.blueSurface,
  surfaceGreen: signal.greenSurface,
  surfaceOrange: brand.orangeSurface,
  surfaceYellow: brand.yellowSurface,
  surfaceRed: signal.redSurface,

  // --- Lines -------------------------------------------------------------
  /** Default hairline. */
  border: 'rgba(23,19,15,0.10)',
  /** Border on an interactive or emphasised surface. */
  borderStrong: 'rgba(23,19,15,0.18)',
  borderOrange: 'rgba(242,100,59,0.30)',
  /** Keyboard focus ring — clears 3:1 against canvas and card. */
  focusRing: brand.orangeInk,
  accentWash: 'rgba(242,100,59,0.10)',

  // --- Text --------------------------------------------------------------
  /** Headings and primary content. */
  text: ink[900],
  /** Supporting copy. 5.9:1 on canvas. */
  textSecondary: ink[600],
  /** Least-emphasis labels. 5.0:1 on canvas — still AA. */
  textMuted: ink[500],
  /** Text on a filled orange or yellow control. */
  onAccent: ink[900],
  /** Text on a filled ink, green, or red control. */
  onDark: warm.surfaceRaised,
  /** Text over a photographic scrim. */
  onImage: '#FFFFFF',

  // --- Status ------------------------------------------------------------
  success: signal.greenInk,
  successSurface: signal.greenSurface,
  error: signal.redInk,
  errorSurface: signal.redSurface,
  warning: brand.yellow,
  warningSurface: brand.yellowSurface,
  info: signal.blueInk,
  infoSurface: signal.blueSurface,

  // --- Overlays ----------------------------------------------------------
  /** Behind modals and sheets. */
  scrim: 'rgba(23,19,15,0.60)',
  /** Over photography, so white text stays readable. */
  imageScrim: 'rgba(23,19,15,0.46)',
  /** Skeleton placeholder fill. */
  skeleton: 'rgba(23,19,15,0.07)',
} as const;

/**
 * Dark palette, kept in lockstep with the light roles above.
 *
 * Not yet wired to a runtime switch: every screen builds its styles with a
 * module-scope `StyleSheet.create`, which cannot react to a theme change.
 * Swapping themes properly means moving those to a `useThemedStyles` hook.
 * The values live here so that migration is mechanical rather than a fresh
 * colour exercise, and so the tokens stay contrast-tested in the meantime.
 * See DESIGN.md, "Dark mode".
 */
export const darkColors = {
  ...colors,

  bgDeep: '#141110',
  bg: '#1C1815',
  card: '#1C1815',
  cardStrong: '#252019',
  cardHover: '#2E2721',
  surfaceSoft: '#252019',
  surfaceSunken: '#141110',
  surfaceBlue: '#1B2438',
  surfaceGreen: '#17251D',
  surfaceOrange: '#2E1A12',
  surfaceYellow: '#2B2313',
  surfaceRed: '#2E1616',

  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.22)',
  borderOrange: 'rgba(242,100,59,0.42)',
  accentWash: 'rgba(242,100,59,0.16)',
  focusRing: brand.orange,

  text: '#F7F3F0',
  textSecondary: '#C3B8B0',
  textMuted: '#A99E96',
  onAccent: ink[900],
  onDark: '#F7F3F0',

  /** On dark surfaces the light tints read better than the *Ink variants. */
  orangeInk: brand.orange,
  greenInk: '#7FC49B',
  redInk: '#F58B90',
  blueInk: '#8FB0F2',
  yellowInk: brand.yellow,

  success: '#7FC49B',
  error: '#F58B90',
  info: '#8FB0F2',

  scrim: 'rgba(0,0,0,0.72)',
  skeleton: 'rgba(255,255,255,0.08)',
} as const;

export type ColorScheme = typeof colors;
