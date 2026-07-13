import assert from 'node:assert/strict';
import test from 'node:test';
import { getEntryRoute, getPostAuthRoute, getSignedInRoute } from './routing';

test('getEntryRoute sends signed-in users with a seen tutorial to their app home', () => {
  assert.equal(getEntryRoute({ seenTutorial: true, token: 'token', role: 'organizer' }), '/(organizer)');
  assert.equal(getEntryRoute({ seenTutorial: true, token: 'token', role: 'attendee' }), '/(tabs)');
});

test('getEntryRoute still shows onboarding before login when tutorial is unseen', () => {
  assert.equal(getEntryRoute({ seenTutorial: false, token: null, role: null }), '/onboarding');
  assert.equal(getEntryRoute({ seenTutorial: false, token: 'token', role: 'organizer' }), '/onboarding');
});

test('getPostAuthRoute prefers redirect params and otherwise uses the signed-in destination', () => {
  assert.equal(getPostAuthRoute({ redirect: ' /reserver/demo ', role: 'attendee' }), '/reserver/demo');
  assert.equal(getPostAuthRoute({ redirect: undefined, role: 'organizer' }), '/(organizer)');
  assert.equal(getPostAuthRoute({ redirect: '', role: null }), '/(tabs)');
});

test('getSignedInRoute maps organizer users to the organizer shell', () => {
  assert.equal(getSignedInRoute('organizer'), '/(organizer)');
  assert.equal(getSignedInRoute('attendee'), '/(tabs)');
  assert.equal(getSignedInRoute(null), '/(tabs)');
});
