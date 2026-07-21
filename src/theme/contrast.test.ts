import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contrastRatio,
  flatten,
  meetsLargeTextContrast,
  meetsTextContrast,
  parseColor,
  relativeLuminance,
} from './contrast';

test('parseColor accepts the formats the theme actually stores', () => {
  assert.deepEqual(parseColor('#FFFFFF'), { red: 255, green: 255, blue: 255 });
  assert.deepEqual(parseColor('#fff'), { red: 255, green: 255, blue: 255 });
  assert.deepEqual(parseColor('rgb(17, 19, 15)'), { red: 17, green: 19, blue: 15 });
  assert.deepEqual(parseColor('rgba(23,19,15,0.6)'), { red: 23, green: 19, blue: 15 });
});

test('parseColor rejects values it cannot measure instead of guessing', () => {
  assert.throws(() => parseColor('rebeccapurple'));
  assert.throws(() => parseColor('#12345'));
});

test('relative luminance matches the WCAG reference points', () => {
  assert.equal(relativeLuminance('#000000'), 0);
  assert.equal(Math.round(relativeLuminance('#FFFFFF') * 1000) / 1000, 1);
});

test('contrast ratio is symmetric and bounded by the 21:1 maximum', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#FFFFFF') * 10) / 10, 21);
  assert.equal(contrastRatio('#123456', '#FEDCBA'), contrastRatio('#FEDCBA', '#123456'));
  assert.equal(contrastRatio('#808080', '#808080'), 1);
});

test('threshold helpers apply the right WCAG floor for each text size', () => {
  // 4.54:1 — passes normal text.
  assert.equal(meetsTextContrast('#767676', '#FFFFFF'), true);
  // 3.54:1 — large text only.
  assert.equal(meetsTextContrast('#949494', '#FFFFFF'), false);
  assert.equal(meetsLargeTextContrast('#949494', '#FFFFFF'), true);
});

test('flatten composites a translucent colour so it can be measured', () => {
  assert.equal(flatten('#000000', 1, '#FFFFFF'), 'rgb(0, 0, 0)');
  assert.equal(flatten('#000000', 0, '#FFFFFF'), 'rgb(255, 255, 255)');
  assert.equal(flatten('#000000', 0.5, '#FFFFFF'), 'rgb(128, 128, 128)');
});
