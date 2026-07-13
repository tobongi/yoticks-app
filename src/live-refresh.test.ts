import assert from 'node:assert/strict';
import test from 'node:test';

import { createLiveRefreshBus } from './live-refresh';

test('notifies every live refresh subscriber', () => {
  const bus = createLiveRefreshBus();
  let firstCount = 0;
  let secondCount = 0;

  const stopFirst = bus.subscribe(() => {
    firstCount += 1;
  });
  const stopSecond = bus.subscribe(() => {
    secondCount += 1;
  });

  bus.notify();
  bus.notify();
  stopFirst();
  bus.notify();
  stopSecond();
  bus.notify();

  assert.equal(firstCount, 2);
  assert.equal(secondCount, 3);
});
