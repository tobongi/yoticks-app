import assert from 'node:assert/strict';
import test from 'node:test';
import { contrastRatio, flatten, CONTRAST_AA_LARGE_TEXT, CONTRAST_AA_TEXT } from '../theme/contrast';
import { SCRIM_MID_OPACITY, SCRIM_TEXT_ZONE_OPACITY, SCRIM_TOP_OPACITY } from './image-scrim-core';

/**
 * Event photography is user-supplied: a bright daytime shot, a white poster,
 * a washed-out phone photo. The only safe assumption is the worst case, so
 * every check below composites against pure white.
 *
 * This exists because the flat 0.46 scrim that shipped before satisfied the
 * large-text threshold and was therefore assumed fine, while the 12 and 14px
 * meta lines sitting on the same image were failing at 3.10:1.
 */

const WORST_CASE_PHOTO = '#FFFFFF';
const SCRIM_INK = '#17130F';
const TEXT_ON_IMAGE = '#FFFFFF';

function ratioAtOpacity(opacity: number) {
  return contrastRatio(TEXT_ON_IMAGE, flatten(SCRIM_INK, opacity, WORST_CASE_PHOTO));
}

test('small meta text over the brightest possible photo still clears AA', () => {
  // Category, city and date render at 12-14px in the text zone.
  const ratio = ratioAtOpacity(SCRIM_TEXT_ZONE_OPACITY);
  assert.ok(
    ratio >= CONTRAST_AA_TEXT,
    `text-zone scrim gives ${ratio.toFixed(2)}:1 on a white photo, needs ${CONTRAST_AA_TEXT}:1`,
  );
});

test('the flat scrim this replaced would have failed that same check', () => {
  // Guards the reasoning, so nobody "simplifies" back to a single value.
  const previous = ratioAtOpacity(0.46);
  assert.ok(previous >= CONTRAST_AA_LARGE_TEXT, 'the old value was fine for headings');
  assert.ok(previous < CONTRAST_AA_TEXT, 'and that is exactly why it was not fine for meta text');
});

test('the top of the image stays light enough to keep the photo readable', () => {
  // If this ever creeps up, the gradient has become a flat scrim again and
  // the photography stops doing any work.
  assert.ok(SCRIM_TOP_OPACITY <= 0.15, 'the top of the image must stay close to the source photo');
  assert.ok(SCRIM_TOP_OPACITY < SCRIM_TEXT_ZONE_OPACITY);
});

test('a heading placed anywhere in the gradient stays readable', () => {
  // Titles can sit higher up on taller cards, so check the midpoint too.
  const midpoint = ratioAtOpacity(SCRIM_MID_OPACITY);
  assert.ok(
    midpoint >= CONTRAST_AA_LARGE_TEXT,
    `mid-gradient gives ${midpoint.toFixed(2)}:1, needs ${CONTRAST_AA_LARGE_TEXT}:1 for large text`,
  );
});
