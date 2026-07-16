import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldUseFallbackScanStats } from './scan-stats';

test('does not replace authenticated scan stats with fallback data during refresh', () => {
  assert.equal(shouldUseFallbackScanStats('organizer-token'), false);
});

test('uses fallback scan stats when no authenticated API is available', () => {
  assert.equal(shouldUseFallbackScanStats(undefined), true);
});
