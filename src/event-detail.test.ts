import assert from 'node:assert/strict';
import test from 'node:test';

import { FALLBACK_EVENTS } from './backend';
import { buildEventDetailModel, formatArrivalTime, formatEventTime } from './event-detail';

test('buildEventDetailModel creates a strong detail view for paid concerts', () => {
  const current = FALLBACK_EVENTS[0];
  const model = buildEventDetailModel(current, FALLBACK_EVENTS);

  assert.equal(model.primaryActionLabel, 'Reserve tickets');
  assert.equal(model.heroBadge, 'Concerts');
  assert.equal(model.facts[0].label, 'Date');
  assert.ok(model.insights.some((item) => item.label === 'Audience'));
  assert.equal(model.relatedEvents[0]?.id, '4');
  assert.match(model.timeline[0]?.time ?? '', /^\d{2}h00$/);
});

test('buildEventDetailModel switches to a free-ticket flow for free events', () => {
  const current = FALLBACK_EVENTS[3];
  const model = buildEventDetailModel(current, FALLBACK_EVENTS);

  assert.equal(model.primaryActionLabel, 'Reserve free ticket');
  assert.equal(model.timeline[0]?.time, '15h00');
  assert.equal(model.faqs[3]?.answer, 'No. This event is free, so reserving it is enough to generate the pass.');
  assert.equal(model.facts[5]?.value, formatArrivalTime(current));
  assert.equal(formatEventTime(current), '18h00');
});
