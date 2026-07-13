import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

const tempRoot = mkdtempSync(join(tmpdir(), 'yoticks-e2e-'));
const tempDbFile = join(tempRoot, 'e2e.db');

process.env.NODE_ENV = 'test';
process.env.YOTICKS_DB_FILE = tempDbFile;

let app: typeof import('./app').app | null = null;
let store: typeof import('./lib/store').store | null = null;

async function initApp() {
  if (app && store) {
    return { app, store };
  }

  const appModule = await import('./app');
  const storeModule = await import('./lib/store');
  app = appModule.app;
  store = storeModule.store;
  return { app, store };
}

async function startApp() {
  const { app: currentApp } = await initApp();
  const server = currentApp.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}/api`,
  };
}

async function requestJson<T>(baseUrl: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const json = (await response.json().catch(() => ({}))) as T;
  return { response, json };
}

test('backend and database flow stays coherent from seed through checkout', async () => {
  const { server, baseUrl } = await startApp();
  const { store: currentStore } = await initApp();

  try {
    const health = await requestJson<{ ok: boolean; app: string }>(baseUrl, '/health');
    assert.equal(health.response.status, 200);
    assert.equal(health.json.ok, true);

    const venues = await requestJson<{ venues: { id: string; city: string; imageUrl: string }[] }>(baseUrl, '/venues');
    assert.equal(venues.response.status, 200);
    assert.ok(venues.json.venues.length >= 7);
    assert.ok(venues.json.venues.every((venue) => venue.imageUrl.length > 20));

    const home = await requestJson<{ featuredEvents: { id: string }[]; upcomingEvents: { id: string }[] }>(baseUrl, '/events/home');
    assert.equal(home.response.status, 200);
    assert.ok(home.json.featuredEvents.length >= 3);
    assert.ok(home.json.upcomingEvents.length >= 1);

    const search = await requestJson<{ query: string; results: { id: string; score: number; matchedFields: string[] }[] }>(
      baseUrl,
      '/events/search?q=Kinshasa',
    );
    assert.equal(search.response.status, 200);
    assert.equal(search.json.query, 'Kinshasa');
    assert.ok(search.json.results.length > 0);

    const providers = await requestJson<{ providers: { name: string; commune: string }[]; stats: { total: number; coveredCommunes: number } }>(
      baseUrl,
      '/providers?city=Kinshasa',
    );
    assert.equal(providers.response.status, 200);
    assert.ok(providers.json.providers.length > 0);
    assert.equal(providers.json.stats.coveredCommunes, 24);

    const badRegister = await requestJson<{ error: string }>(baseUrl, '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing-name@example.com', password: 'abcdefghi' }),
    });
    assert.equal(badRegister.response.status, 400);

    const register = await requestJson<{ token: string; user: { id: string; email: string } }>(baseUrl, '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Flow User',
        email: `flow-${Date.now()}@example.com`,
        password: 'Password123!',
      }),
    });
    assert.equal(register.response.status, 200);
    assert.equal(register.json.user.email, register.json.user.email?.toLowerCase());
    const userToken = register.json.token;

    const me = await requestJson<{ user: { email: string; name: string } }>(baseUrl, '/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(me.response.status, 200);
    assert.equal(me.json.user.name, 'Test Flow User');

    const profile = await requestJson<{ user: { name: string }; stats: { ticketsPurchased: number; citiesVisited: number } }>(
      baseUrl,
      '/auth/profile',
      {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    );
    assert.equal(profile.response.status, 200);
    assert.equal(profile.json.stats.ticketsPurchased, 0);
    assert.equal(profile.json.stats.citiesVisited, 0);

    const updatedProfile = await requestJson<{ user: { name: string; email: string } }>(baseUrl, '/auth/profile', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Updated Flow User',
        email: `updated-${Date.now()}@example.com`,
      }),
    });
    assert.equal(updatedProfile.response.status, 200);
    assert.equal(updatedProfile.json.user.name, 'Updated Flow User');

    const resetPasswordResponse = await requestJson<{ ok: boolean }>(baseUrl, '/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: updatedProfile.json.user.email,
        password: 'Password456!',
      }),
    });
    assert.equal(resetPasswordResponse.response.status, 200);
    assert.equal(resetPasswordResponse.json.ok, true);

    const relogin = await requestJson<{ token: string; user: { email: string } }>(baseUrl, '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: updatedProfile.json.user.email,
        password: 'Password456!',
      }),
    });
    assert.equal(relogin.response.status, 200);
    assert.equal(relogin.json.user.email, updatedProfile.json.user.email);

    const emptyTickets = await requestJson<{ tickets: unknown[] }>(baseUrl, '/tickets', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(emptyTickets.response.status, 200);
    assert.equal(emptyTickets.json.tickets.length, 0);

    const missingEventReserve = await requestJson<{ error: string }>(baseUrl, '/tickets/reserve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    assert.equal(missingEventReserve.response.status, 400);

    const reserve = await requestJson<{ ticket: { id: string; event: { id: string }; code: string } }>(
      baseUrl,
      '/tickets/reserve',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId: '4', tier: 'standard' }),
      },
    );
    assert.equal(reserve.response.status, 201);
    assert.equal(reserve.json.ticket.event.id, '4');
    assert.ok(reserve.json.ticket.code.startsWith('YT-'));

    const ticketList = await requestJson<{ tickets: { id: string }[] }>(baseUrl, '/tickets', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(ticketList.response.status, 200);
    assert.equal(ticketList.json.tickets.length, 1);
    assert.equal(ticketList.json.tickets[0]?.id, reserve.json.ticket.id);

    const ticketDetail = await requestJson<{ ticket: { id: string; event: { id: string } } }>(
      baseUrl,
      `/tickets/${reserve.json.ticket.id}`,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    );
    assert.equal(ticketDetail.response.status, 200);
    assert.equal(ticketDetail.json.ticket.id, reserve.json.ticket.id);

    const eventDetail = await requestJson<{ event: { id: string; title: string } }>(baseUrl, '/events/4');
    assert.equal(eventDetail.response.status, 200);
    assert.equal(eventDetail.json.event.id, '4');

    const missingEvent = await requestJson<{ error: string }>(baseUrl, '/events/does-not-exist');
    assert.equal(missingEvent.response.status, 404);

    const paidSession = await requestJson<{
      session: {
        id: string;
        status: 'requires_merchant_setup' | 'ready_for_payment';
        merchantAccount: { organizerId: string; status: 'needs_info' | 'ready' };
      };
    }>(baseUrl, '/payments/checkout-sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId: '3', tier: 'standard', paymentMethod: 'card' }),
    });
    assert.equal(paidSession.response.status, 201);
    assert.equal(paidSession.json.session.status, 'requires_merchant_setup');
    assert.equal(paidSession.json.session.merchantAccount.organizerId, 'organizer_dakar');
    assert.equal(paidSession.json.session.merchantAccount.status, 'needs_info');

    const organizerLogin = await requestJson<{ token: string; user: { id: string; role: 'organizer' } }>(baseUrl, '/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'organizer', email: 'dakar.nights@example.com' }),
    });
    assert.equal(organizerLogin.response.status, 200);
    assert.equal(organizerLogin.json.user.role, 'organizer');
    assert.equal(organizerLogin.json.user.id, 'organizer_dakar');
    const organizerToken = organizerLogin.json.token;

    const organizerEvents = await requestJson<{ events: { id: string; organizerId?: string }[] }>(baseUrl, '/organizer/events', {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });
    assert.equal(organizerEvents.response.status, 200);
    assert.ok(organizerEvents.json.events.length > 0);
    assert.ok(organizerEvents.json.events.every((event) => event.organizerId === 'organizer_demo' || event.organizerId === 'organizer_dakar'));

    const organizerTickets = await requestJson<{ tickets: { event: { organizerId?: string } }[] }>(baseUrl, '/organizer/tickets', {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });
    assert.equal(organizerTickets.response.status, 200);
    assert.ok(Array.isArray(organizerTickets.json.tickets));

    const createdOrganizerEvent = await requestJson<{ event: { id: string; organizerId?: string; title: string } }>(
      baseUrl,
      '/organizer/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${organizerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Dakar Growth Forum',
          date: '5 Oct 2026',
          location: 'Dakar, SN',
          category: 'Conférences',
          price: '10 000 FC',
          description: 'A full-day event for local operators and founders.',
          organizer: 'Dakar Nights',
        }),
      },
    );
    assert.equal(createdOrganizerEvent.response.status, 201);
    assert.equal(createdOrganizerEvent.json.event.organizerId, 'organizer_dakar');
    assert.equal(createdOrganizerEvent.json.event.title, 'Dakar Growth Forum');

    const forbiddenMerchantUpdate = await requestJson<{ error: string }>(baseUrl, '/payments/merchant-accounts/organizer_dakar', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethod: 'card',
        businessName: 'Not allowed',
      }),
    });
    assert.equal(forbiddenMerchantUpdate.response.status, 403);

    const merchantUpdate = await requestJson<{ merchantAccount: { status: 'needs_info' | 'ready' } }>(
      baseUrl,
      '/payments/merchant-accounts/organizer_dakar',
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${organizerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: 'card',
          businessName: 'Dakar Nights SARL',
          supportEmail: 'payments@dakarnights.sn',
          country: 'Senegal',
          city: 'Dakar',
          phoneNumber: '+221770000000',
          payoutDetails: 'CBAO ending 4421',
        }),
      },
    );
    assert.equal(merchantUpdate.response.status, 200);
    assert.equal(merchantUpdate.json.merchantAccount.status, 'ready');

    const paidSessionReady = await requestJson<{
      session: { status: 'requires_merchant_setup' | 'ready_for_payment'; merchantAccount: { status: 'needs_info' | 'ready' } };
    }>(baseUrl, `/payments/checkout-sessions/${paidSession.json.session.id}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(paidSessionReady.response.status, 200);
    assert.equal(paidSessionReady.json.session.status, 'requires_merchant_setup');
    assert.equal(paidSessionReady.json.session.merchantAccount.status, 'ready');

    const unlockedSession = await requestJson<{
      session: { status: 'requires_merchant_setup' | 'ready_for_payment'; merchantAccount: { status: 'needs_info' | 'ready' } };
    }>(baseUrl, '/payments/checkout-sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId: '3', tier: 'standard', paymentMethod: 'card' }),
    });
    assert.equal(unlockedSession.response.status, 201);
    assert.equal(unlockedSession.json.session.status, 'ready_for_payment');
    assert.equal(unlockedSession.json.session.merchantAccount.status, 'ready');

    const organizerDemoLogin = await requestJson<{ token: string; user: { id: string; role: 'organizer' } }>(baseUrl, '/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'organizer', email: 'organizer@yoticks.dev' }),
    });
    assert.equal(organizerDemoLogin.response.status, 200);
    const organizerDemoToken = organizerDemoLogin.json.token;

    const scanTicket = await requestJson<{
      result: {
        outcome: 'checked_in' | 'already_used' | 'cancelled' | 'not_found';
        ticket: { id: string; status: string; gate: string | null; code: string } | null;
      };
    }>(baseUrl, '/organizer/tickets/scan', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${organizerDemoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'yoticks-ticket:YT-2026-004|event:1|seat:A-18',
        gate: 'North Gate',
      }),
    });
    assert.equal(scanTicket.response.status, 200);
    assert.equal(scanTicket.json.result.outcome, 'checked_in');
    assert.equal(scanTicket.json.result.ticket?.status, 'used');
    assert.equal(scanTicket.json.result.ticket?.gate, 'North Gate');

    const venuesById = await requestJson<{ venue: { id: string } }>(baseUrl, '/venues/venue_01');
    assert.equal(venuesById.response.status, 200);

    const missingVenue = await requestJson<{ error: string }>(baseUrl, '/venues/does-not-exist');
    assert.equal(missingVenue.response.status, 404);

    const venueCatalog = await requestJson<{ venues: { id: string; imageUrl: string }[] }>(baseUrl, '/venues');
    const eventCatalog = await requestJson<{ events: { id: string; organizerId?: string }[] }>(baseUrl, '/events');
    assert.equal(venueCatalog.response.status, 200);
    assert.equal(eventCatalog.response.status, 200);
    assert.ok(venueCatalog.json.venues.some((venue) => venue.imageUrl.startsWith('data:image/png;base64,')));
    assert.ok(eventCatalog.json.events.some((event) => event.organizerId === 'organizer_demo'));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await currentStore.close();
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
