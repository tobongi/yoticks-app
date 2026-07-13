import assert from 'node:assert/strict';
import test from 'node:test';

import {
  KINSHASA_COMMUNES,
  PROVIDER_USERS,
  getCommuneCoverage,
  listProviderUsers,
} from './provider-users';

test('provider directory covers all 24 official Kinshasa communes', () => {
  const kinshasaCommunes = new Set(
    PROVIDER_USERS.filter((provider) => provider.city === 'Kinshasa').map((provider) => provider.commune),
  );

  assert.equal(kinshasaCommunes.size, 24);
  assert.deepEqual(Array.from(kinshasaCommunes).sort(), [...KINSHASA_COMMUNES].sort());
  assert.ok(!kinshasaCommunes.has('Matonge'));
});

test('commune coverage sorts Kinshasa communes by strongest provider presence first', () => {
  const coverage = getCommuneCoverage('Kinshasa');

  assert.equal(coverage[0]?.commune, 'Gombe');
  assert.ok((coverage[0]?.providers.length ?? 0) >= 2);
  assert.equal(coverage.find((entry) => entry.commune === 'Ngaliema')?.providers.length, 2);
});

test('provider lookup can filter by city, commune, and name fragments', () => {
  const limete = listProviderUsers({ city: 'Kinshasa', commune: 'limete' });
  const mutombo = listProviderUsers({ query: 'mutombo' });

  assert.equal(limete.length, 1);
  assert.equal(limete[0]?.commune, 'Limete');
  assert.ok(mutombo.some((provider) => provider.name === 'Grace Mutombo'));
});
