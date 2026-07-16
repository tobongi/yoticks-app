import assert from 'node:assert/strict';
import test from 'node:test';
import { getActionVisual, getCategoryVisual, getScanOutcomeVisual, getTicketVisual } from './visual-language';

test('event categories map accents and spelling variants to concrete visual objects', () => {
  assert.deepEqual(getCategoryVisual('Concerts'), {
    key: 'music',
    label: 'Musique',
    tone: 'orange',
  });
  assert.equal(getCategoryVisual('Conférences').label, 'Conférences');
  assert.equal(getCategoryVisual('Conférences').key, 'talk');
  assert.equal(getCategoryVisual('sport').key, 'sport');
  assert.equal(getCategoryVisual('unknown').key, 'celebrate');
});

test('ticket states always provide icon, color tone, and short corrective label', () => {
  assert.deepEqual(getTicketVisual('valid'), {
    key: 'check',
    label: 'Prêt',
    hint: 'Montre le QR',
    tone: 'green',
  });
  assert.equal(getTicketVisual('used').hint, 'Déjà entré');
  assert.equal(getTicketVisual('cancelled').key, 'blocked');
});

test('primary actions use concrete objects and short verbs', () => {
  assert.deepEqual(getActionVisual('discover'), { key: 'search', label: 'Trouver', tone: 'orange' });
  assert.deepEqual(getActionVisual('scan'), { key: 'scan', label: 'Scanner', tone: 'green' });
  assert.equal(getActionVisual('help').label, 'Aide');
});

test('gate outcomes use unambiguous icon, word, and next instruction', () => {
  assert.deepEqual(getScanOutcomeVisual('checked_in'), { key: 'check', label: 'ENTRE', hint: 'Scanner le suivant', tone: 'green' });
  assert.equal(getScanOutcomeVisual('already_used').label, 'DÉJÀ PASSÉ');
  assert.equal(getScanOutcomeVisual('cancelled').tone, 'red');
  assert.equal(getScanOutcomeVisual('not_found').key, 'help');
});
