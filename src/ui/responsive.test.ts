import assert from 'node:assert/strict';
import test from 'node:test';
import { getPhoneLayout } from './responsive-core';

test('getPhoneLayout collapses grids on tight screens', () => {
  const layout = getPhoneLayout(320);

  assert.equal(layout.isTight, true);
  assert.equal(layout.twoUpWidth, '100%');
  assert.equal(layout.tileWidth, '100%');
  assert.equal(layout.authTopPadding, 28);
});

test('getPhoneLayout preserves denser rows on wider phones', () => {
  const layout = getPhoneLayout(412);

  assert.equal(layout.isCompact, true);
  assert.equal(layout.twoUpWidth, '100%');
  assert.equal(layout.tileWidth, '48.5%');
  assert.equal(layout.featuredPosterWidth >= 168, true);
});

test('getPhoneLayout allows three-up utility tiles on roomy screens', () => {
  const layout = getPhoneLayout(480);

  assert.equal(layout.isCompact, false);
  assert.equal(layout.twoUpWidth, '48.5%');
  assert.equal(layout.tileWidth, '31.5%');
  assert.equal(layout.modalCardWidth, 360);
});
