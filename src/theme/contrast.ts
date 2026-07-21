/**
 * WCAG 2.2 relative-luminance and contrast math.
 *
 * This module exists so colour decisions in the design system are provable
 * instead of eyeballed. `theme/colors.test.ts` asserts every semantic
 * foreground/background pairing shipped by the app clears AA.
 *
 * YoTicks is used outdoors, on cheap screens, by people who may not read
 * comfortably. Contrast is a functional requirement here, not a checkbox.
 */

export type Rgb = { red: number; green: number; blue: number };

/** Minimum contrast ratios required by WCAG 2.2. */
export const CONTRAST_AA_TEXT = 4.5;
export const CONTRAST_AA_LARGE_TEXT = 3;
export const CONTRAST_AA_NON_TEXT = 3;

function expandShortHex(hex: string) {
  return hex
    .split('')
    .map((character) => `${character}${character}`)
    .join('');
}

/**
 * Parses `#rgb`, `#rrggbb`, and `rgb()` / `rgba()` strings.
 * Alpha is ignored: callers must resolve translucent colours against their
 * backdrop with `flatten` before measuring.
 */
export function parseColor(color: string): Rgb {
  const value = color.trim();

  const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) {
      throw new Error(`Unsupported color: ${color}`);
    }
    return {
      red: Number.parseFloat(parts[0]),
      green: Number.parseFloat(parts[1]),
      blue: Number.parseFloat(parts[2]),
    };
  }

  const hex = value.replace(/^#/, '');
  const normalized = hex.length === 3 ? expandShortHex(hex) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Unsupported color: ${color}`);
  }

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function toLinearChannel(channel: number) {
  const ratio = channel / 255;
  return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(color: string): number {
  const { red, green, blue } = parseColor(color);
  return (
    0.2126 * toLinearChannel(red) +
    0.7152 * toLinearChannel(green) +
    0.0722 * toLinearChannel(blue)
  );
}

/** WCAG contrast ratio between two opaque colours, 1 to 21. */
export function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Composites a translucent colour over an opaque backdrop so it can be
 * measured. Border and overlay tokens are stored as rgba, so anything that
 * checks them has to flatten first.
 */
export function flatten(foreground: string, alpha: number, backdrop: string): string {
  const top = parseColor(foreground);
  const bottom = parseColor(backdrop);
  const blend = (topChannel: number, bottomChannel: number) =>
    Math.round(topChannel * alpha + bottomChannel * (1 - alpha));

  return `rgb(${blend(top.red, bottom.red)}, ${blend(top.green, bottom.green)}, ${blend(top.blue, bottom.blue)})`;
}

/** True when the pair clears the AA threshold for normal-size body text. */
export function meetsTextContrast(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= CONTRAST_AA_TEXT;
}

/**
 * True when the pair clears AA for large text (>=24px, or >=18.66px bold)
 * and for meaningful non-text marks such as icons, borders, and focus rings.
 */
export function meetsLargeTextContrast(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= CONTRAST_AA_LARGE_TEXT;
}

/**
 * Picks whichever of two inks reads best on `background`. Used by components
 * that place text on a caller-supplied fill (badges, chips, filled buttons)
 * so a new tone can never silently ship unreadable text.
 */
export function readableInk(background: string, darkInk: string, lightInk: string): string {
  return contrastRatio(darkInk, background) >= contrastRatio(lightInk, background) ? darkInk : lightInk;
}
