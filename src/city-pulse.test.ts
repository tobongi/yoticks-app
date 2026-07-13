import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCityPulse } from './city-pulse';
import type { BackendEvent } from './backend';

const events: BackendEvent[] = [
  {
    id: '1',
    title: 'Kinshasa Jazz Festival',
    date: '15 Juin 2026',
    location: 'Kinshasa, RDC',
    category: 'Concerts',
    price: '5 000 FC',
    description: 'Concerts',
    organizer: 'Kinshasa Culture',
    color: '#F99F22',
    imageUrl: 'https://example.com/1.jpg',
  },
  {
    id: '2',
    title: 'Africa CEO Forum',
    date: '22 Juin 2026',
    location: 'Abidjan, CI',
    category: 'Conférences',
    price: '25 000 FC',
    description: 'Conférences',
    organizer: 'Africa Business+',
    color: '#D71F27',
    imageUrl: 'https://example.com/2.jpg',
  },
  {
    id: '3',
    title: 'Nuit Électro Dakar',
    date: '28 Juin 2026',
    location: 'Dakar, SN',
    category: 'Soirées',
    price: '3 000 FC',
    description: 'Soirées',
    organizer: 'Dakar Nights',
    color: '#3C9449',
    imageUrl: 'https://example.com/3.jpg',
  },
  {
    id: '4',
    title: 'Tournoi de Football Communautaire',
    date: '5 Juil 2026',
    location: 'Kinshasa',
    category: 'Sport',
    price: 'Gratuit',
    description: 'Sport',
    organizer: 'Kinshasa Sport+',
    color: '#F99F22',
    imageUrl: 'https://example.com/4.jpg',
  },
];

test('buildCityPulse assigns distinct category-led copy', () => {
  const pulse = buildCityPulse(events);

  assert.equal(pulse.length, 4);
  assert.deepEqual(
    pulse.map((entry) => entry.label),
    ['Scène live', 'Idées & réseau', 'Nuits en vue', 'Terrain du moment'],
  );
  assert.deepEqual(
    pulse.map((entry) => entry.meta),
    [
      'Jazz, chorales et food court en fin de journée.',
      'Panels, pitchs et rencontres utiles.',
      'DJ sets, lumière et sorties qui restent tard.',
      'Tournois de quartier et ambiance tribune.',
    ],
  );
  assert.deepEqual(
    pulse.map((entry) => entry.count),
    [1, 1, 1, 1],
  );
});
