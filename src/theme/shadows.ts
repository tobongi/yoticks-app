import { Platform, type ViewStyle } from 'react-native';

type ShadowSpec = {
  color: string;
  opacity: number;
  radius: number;
  offset: {
    width: number;
    height: number;
  };
  elevation?: number;
};

function toRgba(color: string, opacity: number) {
  const normalized = color.trim();
  const hex = normalized.replace(/^#/, '');

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    const red = Number.parseInt(`${hex[0]}${hex[0]}`, 16);
    const green = Number.parseInt(`${hex[1]}${hex[1]}`, 16);
    const blue = Number.parseInt(`${hex[2]}${hex[2]}`, 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  return normalized;
}

export function shadow({ color, opacity, radius, offset, elevation }: ShadowSpec): ViewStyle {
  const boxShadow = `${offset.width}px ${offset.height}px ${radius}px ${toRgba(color, opacity)}`;

  if (Platform.OS === 'web') {
    return {
      boxShadow,
    };
  }

  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: offset,
    elevation: elevation ?? Math.max(1, Math.round(radius / 2)),
  };
}

/**
 * Elevation scale.
 *
 * The previous shadows were neutral grey at radius 24 / opacity 0.12, which
 * over a warm canvas produced a muddy halo rather than a lift. These are
 * tinted with the canvas's own brown (#3A2A1E) and kept tight — a shadow's
 * job is to say "this sits above that", not to decorate.
 *
 * Each level is two shadows conceptually: a tight contact shadow plus a
 * wider ambient one. React Native only takes a single shadow per view, so we
 * approximate with a small offset and a radius roughly 2x the offset.
 *
 * Rule of thumb:
 *   flat  — content that belongs to the page (use a border instead)
 *   sm    — cards and list rows
 *   md    — sticky bars, raised panels
 *   lg    — menus, popovers, the tab bar
 *   xl    — modals and sheets
 */
const SHADOW_TINT = '#3A2A1E';

export const elevation = {
  /** No lift. Separate with `colors.border` instead. */
  flat: {} as ViewStyle,
  /** Cards, tiles, list rows. */
  sm: shadow({ color: SHADOW_TINT, opacity: 0.06, radius: 6, offset: { width: 0, height: 2 }, elevation: 2 }),
  /** Raised panels, sticky action bars. */
  md: shadow({ color: SHADOW_TINT, opacity: 0.08, radius: 12, offset: { width: 0, height: 4 }, elevation: 4 }),
  /** Tab bar, popovers, dropdowns. */
  lg: shadow({ color: SHADOW_TINT, opacity: 0.1, radius: 20, offset: { width: 0, height: 8 }, elevation: 8 }),
  /** Modals and bottom sheets. */
  xl: shadow({ color: SHADOW_TINT, opacity: 0.16, radius: 32, offset: { width: 0, height: 14 }, elevation: 14 }),
} as const;

export type ElevationLevel = keyof typeof elevation;
