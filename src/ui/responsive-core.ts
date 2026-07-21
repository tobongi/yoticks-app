/**
 * Layout system.
 *
 * YoTicks ships to phones *and* to the web (yoticks.vercel.app). Before this
 * rewrite the module modelled phone widths only and stopped caring above
 * 480px, so on a 1440px browser the primary call-to-action rendered 1440px
 * wide starting at x=0. Content now lives in a centred column with a real
 * maximum width at every size.
 *
 * The design stays mobile-first on purpose: this is a one-handed, in-a-queue
 * product, and stretching it into a desktop dashboard would make it worse on
 * the device most people actually hold. Wide viewports get a centred app
 * column, generous canvas around it, and denser tile grids — not a different
 * product.
 */

/** Viewport classes. Named after the size class, not the device. */
export type Breakpoint = 'compact' | 'medium' | 'expanded';

export const BREAKPOINTS = {
  /** Phones. */
  compact: 0,
  /** Large phones in landscape, tablets, small browser windows. */
  medium: 600,
  /** Desktop browsers. */
  expanded: 1024,
} as const;

/** Reading column for the primary app content, in points. */
const CONTENT_MAX_WIDTH = 620;
/** Wider column for organiser tables and dashboards. */
const WIDE_MAX_WIDTH = 1080;

export type PhoneLayout = {
  width: number;
  /** Viewport size class. */
  breakpoint: Breakpoint;
  /** True below 430pt — the layout drops to a single column. */
  isCompact: boolean;
  /** True below 360pt — small Androids. Everything goes full width. */
  isTight: boolean;
  /** True at or above 1024pt. Used to show desktop-only affordances. */
  isExpanded: boolean;
  /** Max width of the centred app column. */
  contentMaxWidth: number;
  /** Max width for organiser dashboards and tables. */
  wideMaxWidth: number;
  screenPadding: number;
  sectionGap: number;
  authTopPadding: number;
  heroImageMinHeight: number;
  featuredPosterWidth: number;
  featuredPosterHeight: number;
  twoUpWidth: '100%' | '48.5%';
  tileWidth: '100%' | '48.5%' | '31.5%';
  qrSizeSmall: number;
  qrSizeLarge: number;
  modalCardWidth: number;
  eventTitleSize: number;
  eventTitleLineHeight: number;
};

export function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.expanded) {
    return 'expanded';
  }
  if (width >= BREAKPOINTS.medium) {
    return 'medium';
  }
  return 'compact';
}

export function getLayout(width: number): PhoneLayout {
  const clampedWidth = Math.max(320, width);
  const breakpoint = getBreakpoint(clampedWidth);
  const isTight = clampedWidth < 360;
  const isCompact = clampedWidth < 430;
  const isExpanded = breakpoint === 'expanded';

  // The column the content is actually laid out in. Everything below sizes
  // against this rather than against the viewport, which is what stops wide
  // screens from stretching a phone design edge to edge.
  const columnWidth = Math.min(clampedWidth, CONTENT_MAX_WIDTH);

  const screenPadding = isTight ? 16 : isCompact ? 20 : 24;
  const sectionGap = isTight ? 20 : isCompact ? 24 : 28;
  const innerWidth = columnWidth - screenPadding * 2;

  const featuredPosterWidth = Math.max(180, Math.min(240, innerWidth - (isTight ? 12 : 24)));
  const qrSizeLarge = Math.max(200, Math.min(280, columnWidth - 112));

  return {
    width: clampedWidth,
    breakpoint,
    isCompact,
    isTight,
    isExpanded,
    contentMaxWidth: CONTENT_MAX_WIDTH,
    wideMaxWidth: WIDE_MAX_WIDTH,
    screenPadding,
    sectionGap,
    authTopPadding: isTight ? 28 : isCompact ? 36 : 52,
    heroImageMinHeight: isTight ? 280 : isCompact ? 300 : 340,
    featuredPosterWidth,
    featuredPosterHeight: isTight ? 200 : 232,
    // Two-up needs ~200pt per cell to stay legible; below that, stack.
    twoUpWidth: columnWidth < 430 ? '100%' : '48.5%',
    // Three-up needs ~150pt per cell once padding and gaps are removed.
    tileWidth: isTight ? '100%' : columnWidth < 430 ? '48.5%' : '31.5%',
    qrSizeSmall: isTight ? 140 : isCompact ? 152 : 164,
    qrSizeLarge,
    modalCardWidth: Math.min(420, clampedWidth - 32),
    eventTitleSize: isTight ? 26 : isCompact ? 28 : 32,
    eventTitleLineHeight: isTight ? 32 : isCompact ? 34 : 38,
  };
}

/**
 * @deprecated Kept so existing call sites and tests keep working.
 * Prefer {@link getLayout} — the layout is no longer phone-only.
 */
export const getPhoneLayout = getLayout;
