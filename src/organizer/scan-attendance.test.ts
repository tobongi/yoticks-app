import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAttendanceTierCards } from './scan-attendance';

test('buildAttendanceTierCards returns live tier totals with scan rates', () => {
  const cards = buildAttendanceTierCards({
    pending: 3,
    queued: 2,
    scans: 57,
    totalTickets: 7,
    validTickets: 3,
    usedTickets: 4,
    byTier: [
      {
        tierKey: 'vip',
        tierName: 'VIP Access',
        totalTickets: 2,
        scannedTickets: 2,
        pendingTickets: 0,
        cancelledTickets: 0,
      },
      {
        tierKey: 'standard',
        tierName: 'Standard',
        totalTickets: 5,
        scannedTickets: 2,
        pendingTickets: 2,
        cancelledTickets: 1,
      },
    ],
  });

  assert.deepEqual(cards, [
    {
      key: 'standard',
      name: 'Standard',
      total: 5,
      checkedIn: 2,
      waiting: 2,
      cancelled: 1,
      scanRate: 40,
    },
    {
      key: 'vip',
      name: 'VIP Access',
      total: 2,
      checkedIn: 2,
      waiting: 0,
      cancelled: 0,
      scanRate: 100,
    },
  ]);
});
