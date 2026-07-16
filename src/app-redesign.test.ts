import assert from 'node:assert/strict';
import test from 'node:test';
import type { BackendEvent, BackendOrganizerDashboardStats, BackendOrganizerScanStats, BackendTicket } from './backend';
import { buildHomeDigest, buildOrganizerDigest, buildTicketDigest } from './app-redesign';

const eventA: BackendEvent = {
  id: '1',
  title: 'Kin Groove',
  date: '12 Jul',
  location: 'Kinshasa',
  category: 'Concert',
  price: 'Gratuit',
  description: '',
  organizer: 'YK',
  color: '#000',
  imageUrl: 'https://example.com/a.jpg',
};

const eventB: BackendEvent = {
  ...eventA,
  id: '2',
  title: 'Tech Night',
  location: 'Lubumbashi',
  category: 'Conference',
  price: '15 000 FC',
};

const ticketA: BackendTicket = {
  id: 't1',
  event: eventA,
  seat: 'A1',
  code: 'ABC',
  status: 'valid',
  holderName: 'Jean',
  gate: 'North',
};

const ticketB: BackendTicket = {
  ...ticketA,
  id: 't2',
  code: 'XYZ',
  status: 'used',
  event: eventB,
};

test('buildHomeDigest derives spotlight and quick stats', () => {
  const digest = buildHomeDigest([eventA, eventB], [eventB], []);
  assert.equal(digest.spotlight?.id, '2');
  assert.deepEqual(digest.stats, [
    { label: 'Soir', value: '1' },
    { label: 'Villes', value: '2' },
    { label: 'Gratuit', value: '1' },
  ]);
  assert.equal(digest.categories[0]?.label, 'Concert');
});

test('buildTicketDigest splits active and archived tickets', () => {
  const digest = buildTicketDigest([ticketA, ticketB]);
  assert.equal(digest.active.length, 1);
  assert.equal(digest.archived.length, 1);
  assert.equal(digest.stats[0]?.value, '1');
});

test('buildOrganizerDigest prefers scan counters when present', () => {
  const dashboard: BackendOrganizerDashboardStats = { sales: 24, events: 3, cities: 2, scanRate: 50 };
  const scans: BackendOrganizerScanStats = {
    pending: 0,
    queued: 0,
    scans: 7,
    totalTickets: 10,
    validTickets: 3,
    usedTickets: 7,
    byTier: [],
  };

  const digest = buildOrganizerDigest(dashboard, scans, 1);
  assert.deepEqual(digest.stats, [
    { label: 'Sorties', value: '3' },
    { label: 'Ventes', value: '24' },
    { label: 'Scan', value: '7/10' },
  ]);
});
