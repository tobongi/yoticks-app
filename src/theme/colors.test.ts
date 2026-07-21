import assert from 'node:assert/strict';
import test from 'node:test';
import { colors, darkColors, palette } from './colors';
import {
  CONTRAST_AA_LARGE_TEXT,
  CONTRAST_AA_NON_TEXT,
  CONTRAST_AA_TEXT,
  contrastRatio,
  flatten,
  meetsTextContrast,
  readableInk,
} from './contrast';

/**
 * These tests are the guard rail on the colour system. The audit that
 * preceded this design pass found two failures shipping in production:
 * `textMuted` at 3.29:1 and orange-as-text at 3.15:1, both below the 4.5:1
 * AA floor. YoTicks is aimed at people who may not read comfortably, often
 * outdoors on cheap screens, so those were real defects rather than nitpicks.
 *
 * Any new token has to be added to the tables below.
 */

/** Surfaces that body text is allowed to sit on. */
const TEXT_BACKGROUNDS: [string, string][] = [
  ['canvas', colors.bgDeep],
  ['card', colors.card],
  ['cardStrong', colors.cardStrong],
  ['cardHover', colors.cardHover],
  ['surfaceSunken', colors.surfaceSunken],
];

const TEXT_COLORS: [string, string][] = [
  ['text', colors.text],
  ['textSecondary', colors.textSecondary],
  ['textMuted', colors.textMuted],
];

test('every text colour clears WCAG AA on every surface it can appear on', () => {
  for (const [inkName, inkValue] of TEXT_COLORS) {
    for (const [surfaceName, surfaceValue] of TEXT_BACKGROUNDS) {
      const ratio = contrastRatio(inkValue, surfaceValue);
      assert.ok(
        ratio >= CONTRAST_AA_TEXT,
        `${inkName} on ${surfaceName} is ${ratio.toFixed(2)}:1, needs ${CONTRAST_AA_TEXT}:1`,
      );
    }
  }
});

test('textMuted specifically fixes the 3.29:1 regression found in production', () => {
  assert.ok(contrastRatio(colors.textMuted, colors.bgDeep) >= CONTRAST_AA_TEXT);
  // The value it replaced must never come back.
  assert.notEqual(colors.textMuted, '#93887D');
  assert.ok(contrastRatio('#93887D', colors.bgDeep) < CONTRAST_AA_TEXT);
});

/**
 * The accent tones each have two forms: a saturated `fill` for backgrounds
 * and a darker `*Ink` for text. Mixing them up is what produced the 3.15:1
 * orange category label on every card in the app.
 */
const INK_ON_LIGHT: [string, string][] = [
  ['orangeInk', colors.orangeInk],
  ['greenInk', colors.greenInk],
  ['redInk', colors.redInk],
  ['blueInk', colors.blueInk],
  ['yellowInk', colors.yellowInk],
  ['success', colors.success],
  ['error', colors.error],
  ['info', colors.info],
];

test('accent ink colours are readable as text on light surfaces', () => {
  for (const [name, value] of INK_ON_LIGHT) {
    for (const [surfaceName, surfaceValue] of TEXT_BACKGROUNDS) {
      const ratio = contrastRatio(value, surfaceValue);
      assert.ok(
        ratio >= CONTRAST_AA_TEXT,
        `${name} on ${surfaceName} is ${ratio.toFixed(2)}:1, needs ${CONTRAST_AA_TEXT}:1`,
      );
    }
  }
});

test('saturated fills are not accidentally usable as body text', () => {
  // Documents *why* the *Ink variants exist. If someone later "simplifies"
  // by pointing orangeInk at brand orange, this fails loudly.
  assert.ok(contrastRatio(palette.brand.orange, colors.card) < CONTRAST_AA_TEXT);
  assert.ok(contrastRatio(palette.signal.green, colors.card) < CONTRAST_AA_TEXT);
});

/** Every filled control: the fill and the ink placed on top of it. */
const FILL_PAIRS: [string, string, string][] = [
  ['orange fill', colors.orange, colors.onAccent],
  ['yellow fill', colors.yellow, colors.onAccent],
  ['ink fill', colors.black, colors.onDark],
  ['green fill', colors.greenInk, colors.onDark],
  ['red fill', colors.red, colors.onDark],
  ['blue fill', colors.blue, colors.onDark],
];

test('filled controls have readable labels', () => {
  for (const [name, fill, ink] of FILL_PAIRS) {
    const ratio = contrastRatio(ink, fill);
    assert.ok(ratio >= CONTRAST_AA_TEXT, `${name}: ${ratio.toFixed(2)}:1, needs ${CONTRAST_AA_TEXT}:1`);
  }
});

test('green buttons use the ink green, because the lighter green fails on white', () => {
  // The kit's toneMap deliberately fills with greenInk rather than green.
  assert.ok(contrastRatio(colors.onDark, palette.signal.green) < CONTRAST_AA_TEXT);
  assert.ok(contrastRatio(colors.onDark, colors.greenInk) >= CONTRAST_AA_TEXT);
});

/** Tinted surfaces pair with their own ink, not with the default text colour. */
const SURFACE_PAIRS: [string, string, string][] = [
  ['orange surface', colors.surfaceOrange, colors.orangeInk],
  ['green surface', colors.surfaceGreen, colors.greenInk],
  ['blue surface', colors.surfaceBlue, colors.blueInk],
  ['red surface', colors.surfaceRed, colors.redInk],
  ['yellow surface', colors.surfaceYellow, colors.yellowInk],
];

test('tinted surfaces stay readable with their matching ink and with body text', () => {
  for (const [name, surface, ink] of SURFACE_PAIRS) {
    assert.ok(
      meetsTextContrast(ink, surface),
      `${name}: ink is ${contrastRatio(ink, surface).toFixed(2)}:1`,
    );
    assert.ok(
      meetsTextContrast(colors.text, surface),
      `${name}: body text is ${contrastRatio(colors.text, surface).toFixed(2)}:1`,
    );
  }
});

test('the focus ring clears the 3:1 non-text threshold everywhere it is drawn', () => {
  for (const [surfaceName, surfaceValue] of TEXT_BACKGROUNDS) {
    const ratio = contrastRatio(colors.focusRing, surfaceValue);
    assert.ok(
      ratio >= CONTRAST_AA_NON_TEXT,
      `focus ring on ${surfaceName} is ${ratio.toFixed(2)}:1`,
    );
  }
});

test('white text over the image scrim stays readable on a worst-case white photo', () => {
  // Cards and hero images composite `imageScrim` over arbitrary photography.
  // The worst case is a fully white image, so measure against that.
  const overWhite = flatten('#17130F', 0.46, '#FFFFFF');
  assert.ok(
    contrastRatio(colors.onImage, overWhite) >= CONTRAST_AA_LARGE_TEXT,
    `scrim over white gives ${contrastRatio(colors.onImage, overWhite).toFixed(2)}:1`,
  );
});

test('borders are visible enough to read as edges once flattened', () => {
  const borderOverCanvas = flatten('#17130F', 0.1, colors.bgDeep);
  const strongOverCanvas = flatten('#17130F', 0.18, colors.bgDeep);
  // Hairlines are decorative separators, so they only need to be perceptible,
  // not to hit 3:1 — but the strong border marks interactive edges.
  assert.ok(contrastRatio(borderOverCanvas, colors.bgDeep) > 1.1);
  assert.ok(
    contrastRatio(strongOverCanvas, colors.bgDeep) > contrastRatio(borderOverCanvas, colors.bgDeep),
  );
});

test('dark palette keeps the same guarantees as the light one', () => {
  const darkSurfaces = [darkColors.bgDeep, darkColors.card, darkColors.cardStrong, darkColors.cardHover];
  const darkInks = [darkColors.text, darkColors.textSecondary, darkColors.textMuted];

  for (const ink of darkInks) {
    for (const surface of darkSurfaces) {
      const ratio = contrastRatio(ink, surface);
      assert.ok(ratio >= CONTRAST_AA_TEXT, `dark ${ink} on ${surface} is ${ratio.toFixed(2)}:1`);
    }
  }

  for (const accent of [darkColors.orangeInk, darkColors.greenInk, darkColors.redInk, darkColors.blueInk]) {
    assert.ok(
      contrastRatio(accent, darkColors.bgDeep) >= CONTRAST_AA_TEXT,
      `dark accent ${accent} is ${contrastRatio(accent, darkColors.bgDeep).toFixed(2)}:1`,
    );
  }
});

test('readableInk picks the higher-contrast option for a caller-supplied fill', () => {
  assert.equal(readableInk(colors.yellow, colors.text, colors.onDark), colors.text);
  assert.equal(readableInk(colors.black, colors.text, colors.onDark), colors.onDark);
});
