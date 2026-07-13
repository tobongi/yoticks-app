import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

import { app } from '../app';
import { signToken } from '../middleware/auth';
import { createDataStore, installStoreForTesting } from './store';

async function startIsolatedServer() {
  const dir = mkdtempSync(join(tmpdir(), 'yoticks-app-store-'));
  const filePath = join(dir, 'state.json');
  const sandbox = await installStoreForTesting(filePath);
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  return {
    server,
    port: address.port,
    async cleanup() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await sandbox.restore();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test('persists a reserved ticket across store reloads', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'yoticks-store-'));
  const filePath = join(dir, 'state.json');

  try {
    const firstStore = await createDataStore(filePath);
    const initialCount = (await firstStore.listTicketsForUser('user_demo')).length;

    const ticket = await firstStore.reserveTicket('user_demo', '1', 'standard');
    assert.ok(ticket);
    assert.equal(ticket?.event.id, '1');

    await firstStore.close();
    const secondStore = await createDataStore(filePath);
    const reloadedTicket = await secondStore.getTicket(ticket!.id, 'user_demo');

    assert.ok(reloadedTicket);
    assert.equal(reloadedTicket?.code, ticket?.code);
    assert.equal((await secondStore.listTicketsForUser('user_demo')).length, initialCount + 1);
    await secondStore.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('organizer sees only their own events through the backend', async () => {
  const appServer = await startIsolatedServer();

  try {
    const token = signToken('organizer_demo');
    const response = await fetch(`http://127.0.0.1:${appServer.port}/api/organizer/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(response.status, 200);

    const payload = (await response.json()) as { events: { id: string }[] };
    assert.deepEqual(
      payload.events.map((event) => event.id),
      ['1', '4', '6'],
    );
  } finally {
    await appServer.cleanup();
  }
});

test('organizer sees only tickets for their own events through the backend', async () => {
  const appServer = await startIsolatedServer();

  try {
    const login = await fetch(`http://127.0.0.1:${appServer.port}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'organizer' }),
    });
    assert.equal(login.status, 200);
    const { token } = (await login.json()) as { token: string };

    const response = await fetch(`http://127.0.0.1:${appServer.port}/api/organizer/tickets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(response.status, 200);

    const payload = (await response.json()) as { tickets: { id: string; event: { id: string; organizerId?: string } }[] };
    assert.ok(payload.tickets.length > 0);
    assert.ok(payload.tickets.every((ticket) => ticket.event.organizerId === 'organizer_demo'));
  } finally {
    await appServer.cleanup();
  }
});

test('organizer tickets include the scanned gate for past entries', async () => {
  const appServer = await startIsolatedServer();

  try {
    const login = await fetch(`http://127.0.0.1:${appServer.port}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'organizer' }),
    });
    assert.equal(login.status, 200);
    const { token } = (await login.json()) as { token: string };

    const response = await fetch(`http://127.0.0.1:${appServer.port}/api/organizer/tickets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(response.status, 200);

    const payload = (await response.json()) as { tickets: { gate?: string | null; holderName: string }[] };
    assert.ok(payload.tickets.length > 0);
    assert.ok(payload.tickets.every((ticket) => typeof ticket.holderName === 'string' && ticket.holderName.length > 0));
    assert.ok(payload.tickets.every((ticket) => ticket.gate === null || typeof ticket.gate === 'string'));
  } finally {
    await appServer.cleanup();
  }
});

test('organizer can open a single ticket detail record through the backend', async () => {
  const appServer = await startIsolatedServer();

  try {
    const login = await fetch(`http://127.0.0.1:${appServer.port}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'organizer' }),
    });
    assert.equal(login.status, 200);
    const { token } = (await login.json()) as { token: string };

    const response = await fetch(`http://127.0.0.1:${appServer.port}/api/organizer/tickets/1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(response.status, 200);
    const payload = (await response.json()) as { ticket: { id: string; holderName: string; gate: string | null; event: { id: string } } };
    assert.equal(payload.ticket.id, '1');
    assert.ok(payload.ticket.holderName.length > 0);
    assert.ok(payload.ticket.gate === null || typeof payload.ticket.gate === 'string');
    assert.equal(payload.ticket.event.id, '1');
  } finally {
    await appServer.cleanup();
  }
});

test('organizer scan stats are computed from organizer data', async () => {
  const appServer = await startIsolatedServer();

  try {
    const login = await fetch(`http://127.0.0.1:${appServer.port}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'organizer' }),
    });
    assert.equal(login.status, 200);
    const { token } = (await login.json()) as { token: string };

    const response = await fetch(`http://127.0.0.1:${appServer.port}/api/organizer/scan-stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(response.status, 200);

    const payload = (await response.json()) as {
      stats: {
        pending: number;
        queued: number;
        scans: number;
        totalTickets: number;
        validTickets: number;
        usedTickets: number;
        byTier: Array<{
          tierKey: string;
          tierName: string;
          totalTickets: number;
          scannedTickets: number;
          pendingTickets: number;
          cancelledTickets: number;
        }>;
      };
    };

    assert.equal(payload.stats.queued, 3);
    assert.ok(payload.stats.pending >= 0);
    assert.ok(payload.stats.usedTickets >= 0);
    assert.ok(payload.stats.totalTickets >= payload.stats.validTickets);
    assert.deepEqual(payload.stats.byTier, [
      {
        tierKey: 'standard',
        tierName: 'Standard',
        totalTickets: 4,
        scannedTickets: 2,
        pendingTickets: 1,
        cancelledTickets: 1,
      },
    ]);
  } finally {
    await appServer.cleanup();
  }
});

test('organizer scan stats group live attendance by ticket tier', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'yoticks-store-'));
  const filePath = join(dir, 'state.json');
  let store: Awaited<ReturnType<typeof createDataStore>> | null = null;

  try {
    store = await createDataStore(filePath);
    const created = await store.createEvent('organizer_demo', {
      title: 'YoTicks Tier Lab',
      date: '14 Oct 2026',
      location: 'Kinshasa, RDC',
      category: 'Concerts',
      price: '9 000 FC',
      description: 'Tiered attendance test event.',
      organizer: 'Mika Ndala',
      status: 'published',
      tiers: [
        {
          key: 'standard',
          name: 'Standard',
          price: '9 000 FC',
          inventoryTotal: 10,
          maxPerOrder: 4,
          waitlistEnabled: true,
          perks: ['Mobile ticket'],
        },
        {
          key: 'vip',
          name: 'VIP Access',
          price: '18 000 FC',
          inventoryTotal: 5,
          maxPerOrder: 2,
          waitlistEnabled: false,
          perks: ['Fast lane'],
        },
      ],
    });

    const vipReservation = await store.reserveTickets('user_demo', created.id, 'vip', 1);
    const standardReservation = await store.reserveTickets('user_amy', created.id, 'standard', 1);

    assert.equal(vipReservation?.status, 'confirmed');
    assert.equal(standardReservation?.status, 'confirmed');

    const vipTicket = vipReservation?.tickets[0];
    assert.ok(vipTicket);

    const scanResult = await store.scanOrganizerTicket('organizer_demo', vipTicket.code, 'VIP Gate');
    assert.equal(scanResult.outcome, 'checked_in');

    const stats = await store.getOrganizerScanStats('organizer_demo');
    const vipTier = stats.byTier.find((tier) => tier.tierKey === 'vip');
    const standardTier = stats.byTier.find((tier) => tier.tierKey === 'standard');

    assert.ok(vipTier);
    assert.equal(vipTier?.tierName, 'VIP Access');
    assert.equal(vipTier?.totalTickets, 1);
    assert.equal(vipTier?.scannedTickets, 1);
    assert.equal(vipTier?.pendingTickets, 0);
    assert.equal(vipTier?.cancelledTickets, 0);

    assert.ok(standardTier);
    assert.ok((standardTier?.totalTickets ?? 0) >= 5);
    assert.ok((standardTier?.pendingTickets ?? 0) >= 2);
  } finally {
    await store?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('organizer dashboard stats summarize only organizer-owned data', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'yoticks-store-'));
  const filePath = join(dir, 'state.json');

  try {
    const store = await createDataStore(filePath);
    const stats = await store.getOrganizerDashboardStats('organizer_demo');

    assert.equal(stats.sales, 4);
    assert.equal(stats.events, 3);
    assert.equal(stats.cities, 2);
    assert.equal(stats.scanRate, 50);
    await store.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('organizer can create and update an event in the store', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'yoticks-store-'));
  const filePath = join(dir, 'state.json');

  try {
    const store = await createDataStore(filePath);
    const created = await store.createEvent('organizer_dakar', {
      title: 'Dakar Creator Summit',
      date: '3 Oct 2026',
      location: 'Dakar, SN',
      category: 'Conférences',
      price: '9 000 FC',
      description: 'A new builder-focused event for the Dakar creator economy.',
      organizer: 'Dakar Nights',
      color: '#3C9449',
    });

    assert.equal(created.organizerId, 'organizer_dakar');
    assert.equal(created.title, 'Dakar Creator Summit');
    assert.ok(created.imageUrl.startsWith('data:image/png;base64,'));

    const updated = await store.updateEvent(created.id, {
      price: '11 000 FC',
      description: 'Updated copy for the creator summit.',
      location: 'Dakar, Senegal',
    });

    assert.equal(updated?.price, '11 000 FC');
    assert.equal(updated?.description, 'Updated copy for the creator summit.');
    assert.equal(updated?.location, 'Dakar, Senegal');
    await store.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('organizer can scan a ticket and manually override its status', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'yoticks-store-'));
  const filePath = join(dir, 'state.json');

  try {
    const store = await createDataStore(filePath);
    const scanned = await store.scanOrganizerTicket(
      'organizer_demo',
      'yoticks-ticket:YT-2026-004|event:1|seat:A-18',
      'North Gate',
    );

    assert.equal(scanned.outcome, 'checked_in');
    assert.equal(scanned.ticket?.status, 'used');
    assert.equal(scanned.ticket?.gate, 'North Gate');

    const overridden = await store.updateOrganizerTicket(scanned.ticket!.id, 'organizer_demo', {
      status: 'cancelled',
      gate: null,
    });

    assert.equal(overridden?.status, 'cancelled');
    assert.equal(overridden?.gate, null);
    await store.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('seed data includes multiple organizers and attendees', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'yoticks-store-'));
  const filePath = join(dir, 'state.json');

  try {
    const store = await createDataStore(filePath);
    const users = await store.listUsers();

    assert.ok(users.filter((user) => user.role === 'organizer').length >= 3);
    assert.ok(users.filter((user) => user.role === 'attendee').length >= 8);
    await store.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('paid checkout sessions stop at merchant onboarding when the organizer account is incomplete', async () => {
  const storeDir = mkdtempSync(join(tmpdir(), 'yoticks-payments-'));
  const filePath = join(storeDir, 'state.json');

  try {
    const isolatedStore = await createDataStore(filePath);
    const session = await isolatedStore.createCheckoutSession('user_demo', '3', 'standard', 'card');

    assert.ok(session);
    assert.equal(session?.status, 'requires_merchant_setup');
    assert.equal(session?.merchantAccount.organizerId, 'organizer_dakar');
    assert.equal(session?.merchantAccount.status, 'needs_info');
    await isolatedStore.close();
  } finally {
    rmSync(storeDir, { recursive: true, force: true });
  }
});

test('organizer can complete merchant setup and unlock the next checkout session', async () => {
  const storeDir = mkdtempSync(join(tmpdir(), 'yoticks-payments-'));
  const filePath = join(storeDir, 'state.json');

  try {
    const isolatedStore = await createDataStore(filePath);
    const account = await isolatedStore.updateMerchantAccount('organizer_dakar', 'card', {
      businessName: 'Dakar Nights SARL',
      supportEmail: 'payments@dakarnights.sn',
      country: 'Senegal',
      city: 'Dakar',
      phoneNumber: '+221770000000',
      payoutDetails: 'CBAO ending 4421',
    });

    const session = await isolatedStore.createCheckoutSession('user_demo', '3', 'standard', 'card');

    assert.equal(account.status, 'ready');
    assert.equal(session?.status, 'ready_for_payment');
    assert.equal(session?.merchantAccount.status, 'ready');
    await isolatedStore.close();
  } finally {
    rmSync(storeDir, { recursive: true, force: true });
  }
});

test('saved events persist across store reloads', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'yoticks-saved-'));
  const filePath = join(dir, 'state.json');

  try {
    const firstStore = await createDataStore(filePath);
    const saved = await firstStore.saveEventForUser('user_demo', '1');

    assert.ok(saved);
    assert.equal(saved?.event.id, '1');
    assert.equal((await firstStore.listSavedEventsForUser('user_demo')).length, 1);
    await firstStore.close();

    const secondStore = await createDataStore(filePath);
    const savedEvents = await secondStore.listSavedEventsForUser('user_demo');

    assert.equal(savedEvents.length, 1);
    assert.equal(savedEvents[0]?.event.id, '1');
    await secondStore.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
