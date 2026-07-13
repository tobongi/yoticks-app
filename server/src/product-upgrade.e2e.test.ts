import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

const tempRoot = mkdtempSync(join(tmpdir(), 'yoticks-product-upgrade-'));
const tempDbFile = join(tempRoot, 'product-upgrade.db');

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

test('dynamic inventory, publishing, analytics, discovery, and notifications work as a real product flow', async () => {
  const { server, baseUrl } = await startApp();
  const { store: currentStore } = await initApp();

  try {
    const organizerLogin = await requestJson<{ token: string }>(baseUrl, '/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'organizer', email: 'organizer@yoticks.dev' }),
    });
    assert.equal(organizerLogin.response.status, 200);
    const organizerToken = organizerLogin.json.token;

    const attendeeLogin = await requestJson<{ token: string }>(baseUrl, '/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'attendee', email: 'jean.dupont@example.com' }),
    });
    assert.equal(attendeeLogin.response.status, 200);
    const attendeeToken = attendeeLogin.json.token;

    const createdEvent = await requestJson<{
      event: {
        id: string;
        status: 'draft' | 'published';
        coverImageUrl: string;
        galleryImageUrls: string[];
        venueMapUrl: string | null;
        lineup: Array<{ time: string; title: string; stage: string }>;
        tiers: Array<{
          key: string;
          inventoryTotal: number;
          inventoryRemaining: number;
          maxPerOrder: number;
          waitlistEnabled: boolean;
        }>;
      };
    }>(baseUrl, '/organizer/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${organizerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Kinshasa Product Summit',
        date: '20 Sept 2026',
        location: 'Kinshasa, RDC',
        category: 'Conférences',
        price: '15 000 FC',
        description: 'A flagship launch event for African product teams.',
        organizer: 'YoTicks Demo Live',
        color: '#3C9449',
        status: 'draft',
        coverImageUrl: 'https://images.example.com/cover-product-summit.jpg',
        galleryImageUrls: [
          'https://images.example.com/gallery-1.jpg',
          'https://images.example.com/gallery-2.jpg',
        ],
        venueMapUrl: 'https://images.example.com/venue-map.jpg',
        lineup: [
          { time: '09:00', title: 'Doors & coffee', stage: 'Hall A' },
          { time: '10:00', title: 'Opening keynote', stage: 'Main Stage' },
        ],
        tiers: [
          {
            key: 'standard',
            name: 'Standard',
            price: '15 000 FC',
            inventoryTotal: 2,
            maxPerOrder: 2,
            waitlistEnabled: true,
            perks: ['Main room access'],
          },
          {
            key: 'vip',
            name: 'VIP',
            price: '30 000 FC',
            inventoryTotal: 1,
            maxPerOrder: 1,
            waitlistEnabled: false,
            perks: ['Front row', 'Lounge'],
          },
        ],
        promoCodes: [
          {
            code: 'VIP20',
            discountType: 'percent',
            discountValue: 20,
            tierKey: 'vip',
            maxUses: 5,
          },
        ],
      }),
    });
    assert.equal(createdEvent.response.status, 201);
    assert.equal(createdEvent.json.event.status, 'draft');
    assert.equal(createdEvent.json.event.tiers.length, 2);
    assert.equal(createdEvent.json.event.tiers[0]?.inventoryRemaining, 2);
    assert.equal(createdEvent.json.event.galleryImageUrls.length, 2);
    assert.equal(createdEvent.json.event.lineup.length, 2);

    const publishedEvent = await requestJson<{
      event: {
        id: string;
        status: 'draft' | 'published';
        tiers: Array<{ key: string; inventoryRemaining: number }>;
      };
    }>(baseUrl, `/organizer/events/${createdEvent.json.event.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${organizerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'published',
      }),
    });
    assert.equal(publishedEvent.response.status, 200);
    assert.equal(publishedEvent.json.event.status, 'published');

    const quoteVip = await requestJson<{
      quote: {
        tierKey: string;
        quantity: number;
        subtotal: number;
        discount: number;
        total: number;
        promoApplied: string | null;
        remainingAfterPurchase: number;
        status: 'available' | 'sold_out' | 'waitlist_only';
      };
    }>(baseUrl, '/tickets/quote', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attendeeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: createdEvent.json.event.id,
        tierKey: 'vip',
        quantity: 1,
        promoCode: 'VIP20',
      }),
    });
    assert.equal(quoteVip.response.status, 200);
    assert.equal(quoteVip.json.quote.tierKey, 'vip');
    assert.equal(quoteVip.json.quote.quantity, 1);
    assert.equal(quoteVip.json.quote.discount, 6000);
    assert.equal(quoteVip.json.quote.total, 24000);
    assert.equal(quoteVip.json.quote.promoApplied, 'VIP20');
    assert.equal(quoteVip.json.quote.remainingAfterPurchase, 0);

    const reserveStandard = await requestJson<{
      reservation: {
        status: 'confirmed' | 'waitlisted';
        tickets: Array<{ id: string; seat: string; tierKey: string }>;
        waitlistEntryId: string | null;
      };
    }>(baseUrl, '/tickets/reserve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attendeeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: createdEvent.json.event.id,
        tierKey: 'standard',
        quantity: 2,
      }),
    });
    assert.equal(reserveStandard.response.status, 201);
    assert.equal(reserveStandard.json.reservation.status, 'confirmed');
    assert.equal(reserveStandard.json.reservation.tickets.length, 2);
    assert.equal(reserveStandard.json.reservation.tickets.every((ticket) => ticket.tierKey === 'standard'), true);

    const soldOutStandard = await requestJson<{
      reservation: {
        status: 'confirmed' | 'waitlisted';
        tickets: Array<{ id: string }>;
        waitlistEntryId: string | null;
      };
    }>(baseUrl, '/tickets/reserve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attendeeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: createdEvent.json.event.id,
        tierKey: 'standard',
        quantity: 1,
      }),
    });
    assert.equal(soldOutStandard.response.status, 201);
    assert.equal(soldOutStandard.json.reservation.status, 'waitlisted');
    assert.equal(soldOutStandard.json.reservation.tickets.length, 0);
    assert.ok(soldOutStandard.json.reservation.waitlistEntryId);

    const homeFeed = await requestJson<{
      recommendedEvents: Array<{ id: string; recommendationReason: string }>;
      becauseYouLiked: Array<{ id: string; recommendationReason: string }>;
      followedOrganizerEvents: Array<{ id: string }>;
      recentSearches: string[];
      trendingEvents: Array<{ id: string; trendScore: number }>;
      nearbyEvents: Array<{ id: string }>;
    }>(baseUrl, '/events/home?city=Kinshasa', {
      headers: { Authorization: `Bearer ${attendeeToken}` },
    });
    assert.equal(homeFeed.response.status, 200);
    assert.ok(homeFeed.json.recommendedEvents.length > 0);
    assert.ok(homeFeed.json.becauseYouLiked.length > 0);
    assert.ok(homeFeed.json.trendingEvents.length > 0);

    const followOrganizer = await requestJson<{ ok: boolean }>(baseUrl, '/discovery/follows/organizers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attendeeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ organizerId: 'organizer_demo' }),
    });
    assert.equal(followOrganizer.response.status, 200);
    assert.equal(followOrganizer.json.ok, true);

    const followCategory = await requestJson<{ ok: boolean }>(baseUrl, '/discovery/follows/categories', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attendeeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category: 'Conférences' }),
    });
    assert.equal(followCategory.response.status, 200);
    assert.equal(followCategory.json.ok, true);

    const searchTracked = await requestJson<{
      query: string;
      recentSearches: string[];
      followedOrganizerEvents: Array<{ organizerId?: string }>;
    }>(baseUrl, '/events/search?q=Kinshasa product', {
      headers: { Authorization: `Bearer ${attendeeToken}` },
    });
    assert.equal(searchTracked.response.status, 200);
    assert.equal(searchTracked.json.query, 'Kinshasa product');
    assert.ok(searchTracked.json.recentSearches.includes('Kinshasa product'));
    assert.ok(searchTracked.json.followedOrganizerEvents.some((event) => event.organizerId === 'organizer_demo'));

    const organizerDashboard = await requestJson<{
      stats: {
        sales: number;
        events: number;
        cities: number;
        scanRate: number;
        payoutStatus: 'ready' | 'needs_attention';
      };
      timeline: Array<{ label: string; sales: number }>;
      topCities: Array<{ city: string; tickets: number }>;
      funnel: {
        views: number;
        checkouts: number;
        purchases: number;
        dropOffRate: number;
      };
      eventPerformance: Array<{
        eventId: string;
        published: boolean;
        grossSales: number;
        ticketsSold: number;
        waitlistCount: number;
      }>;
    }>(baseUrl, '/organizer/dashboard', {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });
    assert.equal(organizerDashboard.response.status, 200);
    assert.equal(organizerDashboard.json.stats.payoutStatus, 'ready');
    assert.ok(organizerDashboard.json.timeline.length > 0);
    assert.ok(organizerDashboard.json.topCities.length > 0);
    assert.ok(organizerDashboard.json.funnel.views >= organizerDashboard.json.funnel.purchases);
    assert.ok(
      organizerDashboard.json.eventPerformance.some(
        (event) =>
          event.eventId === createdEvent.json.event.id &&
          event.published === true &&
          event.ticketsSold === 2 &&
          event.waitlistCount === 1,
      ),
    );

    const gateUpdate = await requestJson<{ ticket: { id: string; gate: string | null } }>(
      baseUrl,
      `/organizer/tickets/${reserveStandard.json.reservation.tickets[0]!.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${organizerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gate: 'East Gate' }),
      },
    );
    assert.equal(gateUpdate.response.status, 200);
    assert.equal(gateUpdate.json.ticket.gate, 'East Gate');

    const attendeeNotifications = await requestJson<{
      notifications: Array<{
        id: string;
        type: string;
        title: string;
        readAt: string | null;
        data: { url?: string };
      }>;
    }>(baseUrl, '/notifications', {
      headers: { Authorization: `Bearer ${attendeeToken}` },
    });
    assert.equal(attendeeNotifications.response.status, 200);
    assert.ok(attendeeNotifications.json.notifications.some((notification) => notification.type === 'ticket_confirmation'));
    assert.ok(attendeeNotifications.json.notifications.some((notification) => notification.type === 'waitlist_joined'));
    assert.ok(attendeeNotifications.json.notifications.some((notification) => notification.type === 'gate_changed'));

    const firstNotification = attendeeNotifications.json.notifications[0];
    assert.ok(firstNotification);
    const markRead = await requestJson<{ ok: boolean }>(
      baseUrl,
      `/notifications/${firstNotification!.id}/read`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${attendeeToken}` },
      },
    );
    assert.equal(markRead.response.status, 200);
    assert.equal(markRead.json.ok, true);

    const organizerNotifications = await requestJson<{
      notifications: Array<{ type: string; title: string }>;
    }>(baseUrl, '/notifications', {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });
    assert.equal(organizerNotifications.response.status, 200);
    assert.ok(organizerNotifications.json.notifications.some((notification) => notification.type === 'organizer_ticket_reserved'));
    assert.ok(organizerNotifications.json.notifications.some((notification) => notification.type === 'organizer_waitlist_joined'));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await currentStore.close();
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
