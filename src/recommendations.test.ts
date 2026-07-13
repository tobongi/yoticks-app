import assert from 'node:assert/strict';
import test from 'node:test';

import { FALLBACK_EVENTS } from './backend';
import { buildRelatedEvents } from './recommendations';

test('buildRelatedEvents prefers the closest city and nearby dates over weak matches', () => {
  const current = FALLBACK_EVENTS[3];
  const related = buildRelatedEvents(current, FALLBACK_EVENTS);

  assert.equal(related[0]?.id, '1');
  assert.match(related[0]?.reason ?? '', /Meme ville/);
  assert.ok(related.every((event) => event.score >= 4 || event.id === related[0]?.id));
});
