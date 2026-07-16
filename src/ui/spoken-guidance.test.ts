import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSpokenGuidance } from './spoken-guidance';

test('spoken guidance trims visual punctuation and keeps the instruction short', () => {
  assert.deepEqual(buildSpokenGuidance('  Montre ton QR !  '), {
    language: 'fr-FR',
    text: 'Montre ton QR !',
    rate: 0.86,
  });
});

test('spoken guidance rejects empty instructions', () => {
  assert.throws(() => buildSpokenGuidance('   '), /instruction/i);
});
