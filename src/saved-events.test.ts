import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeSavedEventIds, parseSavedEventIds } from './saved-events-core';

test('parseSavedEventIds keeps only unique string ids', () => {
  assert.deepEqual(parseSavedEventIds('["1","2","1",3,null," 2 "]'), ['1', '2']);
});

test('parseSavedEventIds returns an empty list for invalid payloads', () => {
  assert.deepEqual(parseSavedEventIds('nope'), []);
  assert.deepEqual(parseSavedEventIds('{"id":"1"}'), []);
});

test('mergeSavedEventIds preserves unique ids across sources', () => {
  assert.deepEqual(mergeSavedEventIds(['2', '1'], ['1', '3', '']), ['2', '1', '3']);
});
