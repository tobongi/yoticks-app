import test from 'node:test';
import assert from 'node:assert/strict';

import { isOriginAllowed } from './security';

test('allows localhost origins used by the app during local development', () => {
  assert.equal(isOriginAllowed('http://localhost:19006'), true);
  assert.equal(isOriginAllowed('http://127.0.0.1:19006'), true);
  assert.equal(isOriginAllowed('http://[::1]:19006'), true);
});
