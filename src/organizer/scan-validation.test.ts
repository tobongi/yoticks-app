import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScanValidationDetails } from './scan-validation';

test('formats a scan audit with exact date, weekday, time, source, and scanner', () => {
  const details = buildScanValidationDetails({
    audit: {
      id: 'scan_1',
      scannedAt: '2026-07-13T14:32:05.000Z',
      gate: 'Entrée principale',
      scannerId: 'organizer_demo',
      scannerName: 'Mamadou Organizer',
      scannerRole: 'organizer',
      source: 'qr',
      outcome: 'checked_in',
    },
    ticket: {
      code: 'YT-2026-004',
      holderName: 'Jean Dupont',
      seat: 'A-18',
      tierKey: 'vip',
      pricePaid: 9000,
      event: { title: 'Kinshasa Jazz Festival', date: '15 Juin 2026', location: 'Kinshasa, RDC', organizer: 'Kinshasa Culture' },
    },
  });

  assert.deepEqual(details, {
    auditId: 'scan_1',
    code: 'YT-2026-004',
    holderName: 'Jean Dupont',
    eventTitle: 'Kinshasa Jazz Festival',
    eventDate: '15 Juin 2026',
    eventLocation: 'Kinshasa, RDC',
    eventOrganizer: 'Kinshasa Culture',
    seat: 'A-18',
    ticketTier: 'VIP',
    pricePaidLabel: '9 000 FC',
    gate: 'Entrée principale',
    scannerName: 'Mamadou Organizer',
    scannerRole: 'organizer',
    sourceLabel: 'QR',
    outcome: 'checked_in',
    scannedAtIso: '2026-07-13T14:32:05.000Z',
    scannedAtLabel: 'lundi 13 juillet 2026 à 16:32:05',
  });
});
