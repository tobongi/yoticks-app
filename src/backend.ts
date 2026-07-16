import { notifyLiveRefresh } from './live-refresh';
import { groupEventsByCity } from './cities';
import {
  groupProvidersByCommune,
  listProviderUsers as listFallbackProviderUsers,
  type CommuneCoverage,
  type ProviderUser,
} from './provider-users';

import { resolveApiBaseUrl } from './api-config';
import type { MobileMoneyCountryOption } from './mobile-money-checkout';

export const API_BASE_URL = resolveApiBaseUrl({
  configuredUrl: process.env.EXPO_PUBLIC_API_URL,
  debuggerHost: undefined,
  isDev: typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production',
});

export type BackendEvent = {
  id: string;
  organizerId?: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: string;
  description: string;
  organizer: string;
  color: string;
  imageUrl: string;
  status?: 'draft' | 'published';
  coverImageUrl?: string;
  venueMapUrl?: string | null;
  galleryImageUrls?: string[];
  lineup?: BackendEventLineupItem[];
  tiers?: BackendEventTier[];
};

export type BackendEventLineupItem = {
  time: string;
  title: string;
  stage: string;
};

export type BackendEventTier = {
  key: string;
  name: string;
  price: string;
  priceCents: number;
  inventoryTotal: number;
  inventoryRemaining: number;
  maxPerOrder: number;
  waitlistEnabled: boolean;
  perks: string[];
};

export type BackendVenue = {
  id: string;
  name: string;
  city: string;
  country: string;
  district: string | null;
  category: string;
  description: string;
  imageUrl: string;
};

export type BackendSearchHit = BackendEvent & {
  score: number;
  matchedFields: string[];
};

export type BackendSearchResponse = {
  query: string;
  queryWords: string[];
  normalizedQuery: string;
  suggestions: string[];
  results: BackendSearchHit[];
  recentSearches?: string[];
  followedOrganizerEvents?: BackendEvent[];
  facets: {
    categories: { label: string; count: number }[];
    cities: { label: string; count: number }[];
  };
};

export type BackendTicket = {
  id: string;
  event: BackendEvent;
  seat: string;
  code: string;
  status: 'valid' | 'used' | 'cancelled';
  holderName: string;
  gate: string | null;
  tierKey?: string;
  pricePaid?: number;
};

export type BackendSavedEvent = {
  event: BackendEvent;
  createdAt: string;
};

export type BackendOrganizerScanStats = {
  pending: number;
  queued: number;
  scans: number;
  totalTickets: number;
  validTickets: number;
  usedTickets: number;
  byTier: BackendOrganizerScanTierStat[];
};

export type BackendOrganizerScanTierStat = {
  tierKey: string;
  tierName: string;
  totalTickets: number;
  scannedTickets: number;
  pendingTickets: number;
  cancelledTickets: number;
};

export type BackendOrganizerDashboardStats = {
  sales: number;
  events: number;
  cities: number;
  scanRate: number;
  payoutStatus?: 'ready' | 'needs_attention';
};

export type BackendReserveResponse = {
  ticket: BackendTicket;
};

export type BackendReservationQuote = {
  tierKey: string;
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
  promoApplied: string | null;
  remainingAfterPurchase: number;
  status: 'available' | 'sold_out' | 'waitlist_only';
};

export type BackendReservationResult = {
  status: 'confirmed' | 'waitlisted';
  tickets: BackendTicket[];
  waitlistEntryId: string | null;
};

export type BackendNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  data: { url?: string };
};

export type BackendOrganizerDashboard = {
  stats: BackendOrganizerDashboardStats;
  timeline: { label: string; sales: number }[];
  topCities: { city: string; tickets: number }[];
  funnel: {
    views: number;
    checkouts: number;
    purchases: number;
    dropOffRate: number;
  };
  eventPerformance: {
    eventId: string;
    published: boolean;
    grossSales: number;
    ticketsSold: number;
    waitlistCount: number;
  }[];
};

export type BackendHomeFeed = {
  featuredEvents: BackendEvent[];
  upcomingEvents: BackendEvent[];
  categories: string[];
  trendingEvents: BackendEvent[];
  recommendedEvents: (BackendEvent & { recommendationReason?: string })[];
  becauseYouLiked: (BackendEvent & { recommendationReason?: string })[];
  recentSearches: string[];
  followedOrganizerEvents: BackendEvent[];
  nearbyEvents: BackendEvent[];
};

export type BackendPaymentMethodKey = 'apple_pay' | 'google_pay' | 'paypal' | 'card' | 'mbiyopay_mobile_money';

export type BackendMobileMoneyTransaction = {
  id: string;
  checkoutSessionId: string;
  status: 'pending' | 'successful' | 'failed' | 'cancelled';
  providerTransactionId: string | null;
  instructions: string | null;
  authMode: 'confirm' | 'pin' | null;
  redirectUrl: string | null;
  amount: number;
  providerFee: number | null;
  chargedAmount: number | null;
  providerStatus: string | null;
  network: string;
  countryCode: string;
  currency: string;
  createdAt: string;
  reconciliationCheckedAt: string | null;
  reservationIssuedAt: string | null;
};

export type BackendMerchantField = {
  key: 'businessName' | 'supportEmail' | 'country' | 'city' | 'phoneNumber' | 'payoutDetails';
  label: string;
  placeholder: string;
  value: string;
};

export type BackendMerchantAccount = {
  organizerId: string;
  provider: BackendPaymentMethodKey;
  providerName: string;
  status: 'needs_info' | 'ready';
  fields: BackendMerchantField[];
  setupPath: string;
};

export type BackendCheckoutSession = {
  id: string;
  userId: string;
  eventId: string;
  organizerId: string;
  tier: string;
  paymentMethod: BackendPaymentMethodKey;
  amount: number;
  quantity: number;
  amountLabel: string;
  status: 'requires_merchant_setup' | 'ready_for_payment';
  createdAt: string;
  providerName: string;
  event: BackendEvent;
  merchantAccount: BackendMerchantAccount;
};

export type BackendUpdateEventInput = {
  title?: string;
  date?: string;
  location?: string;
  category?: string;
  organizer?: string;
  price?: string;
  description?: string;
  color?: string;
  status?: 'draft' | 'published';
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  venueMapUrl?: string | null;
  lineup?: BackendEventLineupItem[];
  tiers?: {
    key: string;
    name: string;
    price: string;
    inventoryTotal: number;
    maxPerOrder: number;
    waitlistEnabled: boolean;
    perks: string[];
  }[];
  promoCodes?: {
    code: string;
    discountType: 'percent' | 'amount';
    discountValue: number;
    maxUses: number;
    tierKey?: string | null;
  }[];
};

export type BackendCreateEventInput = {
  title: string;
  date: string;
  location: string;
  category: string;
  price: string;
  description: string;
  organizer?: string;
  color?: string;
  status?: 'draft' | 'published';
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  venueMapUrl?: string | null;
  lineup?: BackendEventLineupItem[];
  tiers?: {
    key: string;
    name: string;
    price: string;
    inventoryTotal: number;
    maxPerOrder: number;
    waitlistEnabled: boolean;
    perks: string[];
  }[];
  promoCodes?: {
    code: string;
    discountType: 'percent' | 'amount';
    discountValue: number;
    maxUses: number;
    tierKey?: string | null;
  }[];
};

export type BackendUser = {
  id: string;
  email: string | null;
  name: string;
  role: 'attendee' | 'organizer';
  avatarUrl: string | null;
  totalSpend: number;
};

export type BackendProfileSummary = {
  user: BackendUser;
  stats: {
    ticketsPurchased: number;
    eventsFollowed: number;
    citiesVisited: number;
    totalSpend: number;
  };
};

export type BackendUpdateTicketInput = {
  status?: BackendTicket['status'];
  gate?: string | null;
};

export type BackendOrganizerTicketScanResult = {
  outcome: 'checked_in' | 'already_used' | 'cancelled' | 'not_found';
  ticket: BackendTicket | null;
  scan?: BackendTicketScanAudit;
};

export type BackendTicketScanAudit = {
  id: string;
  scannedAt: string;
  gate: string;
  scannerId: string;
  scannerName: string;
  scannerRole: string;
  source: 'qr' | 'manual';
  outcome: 'checked_in' | 'already_used' | 'cancelled' | 'not_found';
};

export type BackendProviderUser = ProviderUser;

export type BackendProviderDirectoryResponse = {
  providers: BackendProviderUser[];
  coverage: CommuneCoverage[];
  facets: {
    cities: { label: string; count: number }[];
    communes: { label: string; count: number }[];
  };
  stats: {
    total: number;
    coveredCommunes: number;
  };
};

const FALLBACK_EVENTS: BackendEvent[] = [
  {
    id: '1',
    organizerId: 'organizer_demo',
    title: 'Kinshasa Jazz Festival',
    date: '15 Juin 2026',
    location: 'Kinshasa, RDC',
    category: 'Concerts',
    price: '5 000 FC',
    description: 'La plus grande célébration de jazz en Afrique centrale. 12 artistes internationaux, 3 scènes, food court africain.',
    organizer: 'Kinshasa Culture',
    color: '#F99F22',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    coverImageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    galleryImageUrls: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
    ],
    venueMapUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80',
    lineup: [
      { time: '18:00', title: 'Doors open', stage: 'Main Stage' },
      { time: '20:30', title: 'Headliner', stage: 'Main Stage' },
    ],
    tiers: [
      { key: 'standard', name: 'Standard', price: '5 000 FC', priceCents: 5000, inventoryTotal: 120, inventoryRemaining: 34, maxPerOrder: 4, waitlistEnabled: true, perks: ['Mobile ticket', 'Main access'] },
      { key: 'vip', name: 'VIP', price: '9 000 FC', priceCents: 9000, inventoryTotal: 24, inventoryRemaining: 2, maxPerOrder: 2, waitlistEnabled: false, perks: ['Priority line', 'Premium zone'] },
    ],
  },
  {
    id: '2',
    title: 'Africa CEO Forum',
    date: '22 Juin 2026',
    location: 'Abidjan, CI',
    category: 'Conférences',
    price: '25 000 FC',
    description: 'Le sommet des dirigeants africains. 500+ CEO, panels, networking, pitch startups. Thème 2026 : IA & Souveraineté.',
    organizer: 'Africa Business+',
    color: '#D71F27',
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
  },
  {
    id: '3',
    organizerId: 'organizer_dakar',
    title: 'Nuit Électro Dakar',
    date: '28 Juin 2026',
    location: 'Dakar, SN',
    category: 'Soirées',
    price: '3 000 FC',
    description: 'La nuit la plus attendue de la saison. DJs internationaux, son Dolby Atmos, light show immersif.',
    organizer: 'Dakar Nights',
    color: '#3C9449',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
  },
  {
    id: '4',
    organizerId: 'organizer_demo',
    title: 'Tournoi de Football Communautaire',
    date: '5 Juil 2026',
    location: 'Kinshasa',
    category: 'Sport',
    price: 'Gratuit',
    description: 'Un tournoi local ouvert aux équipes de quartier avec ambiance familiale, animations et trophées.',
    organizer: 'Kinshasa Sport+',
    color: '#F99F22',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
  },
  {
    id: '5',
    title: 'Salon de la Mode Africaine',
    date: '12 Juil 2026',
    location: 'Douala',
    category: 'Festivals',
    price: '8 000 FC',
    description: 'Défilés, marques émergentes et créateurs invités autour de la scène mode africaine contemporaine.',
    organizer: 'Atelier Mode CI',
    color: '#D71F27',
    imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e28f?auto=format&fit=crop&w=1200&q=80',
    status: 'draft',
  },
  {
    id: '6',
    organizerId: 'organizer_demo',
    title: 'Concert Gospel Gratitude',
    date: '19 Juil 2026',
    location: 'Libreville',
    category: 'Concerts',
    price: '2 500 FC',
    description: 'Une soirée gospel chaleureuse avec chorales invitées et mise en scène live pensée pour la scène.',
    organizer: 'Gratitude Live',
    color: '#3C9449',
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
  },
  {
    id: '7',
    title: 'Forum Jeunesse & Innovation',
    date: '26 Juil 2026',
    location: 'Nairobi',
    category: 'Conférences',
    price: 'Gratuit',
    description: 'Rencontres, ateliers et démos autour de l’entrepreneuriat, de l’IA et des métiers de demain.',
    organizer: 'Youth Impact',
    color: '#FFC516',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
  },
];

const FALLBACK_TICKETS: BackendTicket[] = [
  { id: '1', event: FALLBACK_EVENTS[0], seat: 'A-12', code: 'YT-2026-001', status: 'used', holderName: 'Amy Nkosi', gate: 'North Gate' },
  { id: '2', event: FALLBACK_EVENTS[3], seat: 'VIP', code: 'YT-2026-002', status: 'used', holderName: 'Leo Mukendi', gate: 'West Entry' },
  { id: '3', event: FALLBACK_EVENTS[5], seat: 'B-07', code: 'YT-2026-000', status: 'cancelled', holderName: 'Sara Bemba', gate: 'South Gate' },
  { id: '4', event: FALLBACK_EVENTS[0], seat: 'A-18', code: 'YT-2026-004', status: 'valid', holderName: 'Jean Dupont', gate: null },
];

const FALLBACK_NOTIFICATIONS: BackendNotification[] = [
  {
    id: 'notif_1',
    type: 'ticket_confirmation',
    title: 'Ticket confirmed',
    body: 'Your QR pass is ready in My Tickets.',
    readAt: null,
    createdAt: new Date('2026-07-05T10:00:00.000Z').toISOString(),
    data: { url: '/(tabs)/tickets' },
  },
  {
    id: 'notif_2',
    type: 'event_reminder',
    title: 'Event reminder',
    body: 'Kinshasa Jazz Festival starts tomorrow at 18h00.',
    readAt: null,
    createdAt: new Date('2026-07-05T12:30:00.000Z').toISOString(),
    data: { url: '/event/1' },
  },
];

const FALLBACK_USER: BackendUser = {
  id: 'demo',
  email: 'jean.dupont@example.com',
  name: 'Jean Dupont',
  role: 'attendee',
  avatarUrl: null,
  totalSpend: 0,
};

const FALLBACK_VENUES: BackendVenue[] = Array.from(
  new Map(
    FALLBACK_EVENTS.map((event, index) => [
      `${event.location}-${event.title}`,
      {
        id: `venue_${String(index + 1).padStart(2, '0')}`,
        name: event.title,
        city: event.location.split(',')[0]?.trim() || event.location,
        country: event.location.split(',')[1]?.trim() || '',
        district: null,
        category: event.category,
        description: event.description,
        imageUrl: event.imageUrl,
      } satisfies BackendVenue,
    ]),
  ).values(),
);

const MONTHS: Record<string, number> = {
  janv: 0,
  janvier: 0,
  fevr: 1,
  févr: 1,
  fevrier: 1,
  février: 1,
  mars: 2,
  avr: 3,
  avril: 3,
  mai: 4,
  juin: 5,
  juil: 6,
  juillet: 6,
  aout: 7,
  août: 7,
  sept: 8,
  septembre: 8,
  oct: 9,
  octobre: 9,
  nov: 10,
  novembre: 10,
  dec: 11,
  déc: 11,
  decembre: 11,
  décembre: 11,
};

function parseEventDate(date: string) {
  const match = date.match(/^(\d{1,2})\s+([A-Za-zéûôîÉÛÔÎàâêëïüç]+)\s+(\d{4})$/);
  if (!match) return Number.POSITIVE_INFINITY;
  const day = Number(match[1]);
  const monthKey = match[2].toLowerCase();
  const year = Number(match[3]);
  const month = MONTHS[monthKey] ?? MONTHS[monthKey.slice(0, 4)] ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return Number.POSITIVE_INFINITY;
  }
  return new Date(year, month, day).getTime();
}

function sortEventsByDate(events: BackendEvent[]) {
  return [...events].sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));
}

function sortCountEntries(entries: Map<string, number>) {
  return Array.from(entries.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

function buildFallbackProviderDirectory(city?: string, commune?: string, query?: string): BackendProviderDirectoryResponse {
  const providers = listFallbackProviderUsers({ city, commune, query });
  const scoped = city ? listFallbackProviderUsers({ city }) : providers;
  const facetSource = providers.length > 0 ? providers : scoped;
  const cities = new Map<string, number>();
  const communes = new Map<string, number>();

  for (const provider of facetSource) {
    cities.set(provider.city, (cities.get(provider.city) ?? 0) + 1);
    communes.set(provider.commune, (communes.get(provider.commune) ?? 0) + 1);
  }

  return {
    providers,
    coverage: groupProvidersByCommune(scoped),
    facets: {
      cities: sortCountEntries(cities),
      communes: sortCountEntries(communes),
    },
    stats: {
      total: providers.length,
      coveredCommunes: new Set(scoped.map((provider) => provider.commune)).size,
    },
  };
}

async function requestJson<T>(path: string, init: RequestInit = {}, token?: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function requestJsonOrThrow<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } & T | null;
  if (!response.ok) {
    throw new Error(payload?.error?.trim() || 'Connexion impossible');
  }

  if (!payload) {
    throw new Error('Réponse du serveur invalide');
  }

  return payload as T;
}

export async function updateOrganizerEvent(
  token: string | undefined,
  eventId: string,
  input: BackendUpdateEventInput,
): Promise<BackendEvent | null> {
  if (!token) {
    const event = FALLBACK_EVENTS.find((entry) => entry.id === eventId);
    if (!event) {
      return null;
    }

    return {
      ...event,
      organizer: typeof input.organizer === 'string' && input.organizer.trim() ? input.organizer.trim() : event.organizer,
      price: typeof input.price === 'string' && input.price.trim() ? input.price.trim() : event.price,
    };
  }

  const payload = await requestJson<{ event: BackendEvent }>(
    `/organizer/events/${eventId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    token,
  );
  return payload?.event ?? null;
}

export async function createOrganizerEvent(
  token: string | undefined,
  input: BackendCreateEventInput,
): Promise<BackendEvent | null> {
  if (!token) {
    const nextId = String(FALLBACK_EVENTS.length + 1);
    return {
      id: nextId,
      organizerId: 'organizer_demo',
      title: input.title.trim(),
      date: input.date.trim(),
      location: input.location.trim(),
      category: input.category.trim(),
      price: input.price.trim(),
      description: input.description.trim(),
      organizer: input.organizer?.trim() || 'YoTicks Organizer',
      color: input.color?.trim() || '#F99F22',
      imageUrl: FALLBACK_EVENTS[0]?.imageUrl ?? '',
    };
  }

  const payload = await requestJson<{ event: BackendEvent }>(
    '/organizer/events',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return payload?.event ?? null;
}

export async function listEvents(query = ''): Promise<BackendEvent[]> {
  const payload = await requestJson<{ events: BackendEvent[] }>(
    `/events${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`,
  );
  return payload?.events ?? sortEventsByDate(FALLBACK_EVENTS);
}

export async function listOrganizerEvents(token?: string, organizerId?: string): Promise<BackendEvent[]> {
  if (!token) {
    return sortEventsByDate(
      organizerId ? FALLBACK_EVENTS.filter((event) => event.organizerId === organizerId) : FALLBACK_EVENTS,
    );
  }

  const payload = await requestJson<{ events: BackendEvent[] }>('/organizer/events', {}, token);
  return (
    payload?.events ??
    sortEventsByDate(
      organizerId ? FALLBACK_EVENTS.filter((event) => event.organizerId === organizerId) : FALLBACK_EVENTS,
    )
  );
}

export async function listOrganizerTickets(token?: string, organizerId?: string): Promise<BackendTicket[]> {
  if (!token) {
    return organizerId
      ? FALLBACK_TICKETS.filter((ticket) => ticket.event.organizerId === organizerId)
      : FALLBACK_TICKETS;
  }

  const payload = await requestJson<{ tickets: BackendTicket[] }>('/organizer/tickets', {}, token);
  return (
    payload?.tickets ??
    (organizerId ? FALLBACK_TICKETS.filter((ticket) => ticket.event.organizerId === organizerId) : FALLBACK_TICKETS)
  );
}

export async function getOrganizerTicket(token?: string, organizerId?: string, ticketId?: string): Promise<BackendTicket | null> {
  if (!ticketId) {
    return null;
  }

  if (!token) {
    return (
      (organizerId ? FALLBACK_TICKETS.filter((ticket) => ticket.event.organizerId === organizerId) : FALLBACK_TICKETS).find(
        (ticket) => ticket.id === ticketId,
      ) ?? null
    );
  }

  const payload = await requestJson<{ ticket: BackendTicket }>(`/organizer/tickets/${ticketId}`, {}, token);
  return (
    payload?.ticket ??
    ((organizerId ? FALLBACK_TICKETS.filter((ticket) => ticket.event.organizerId === organizerId) : FALLBACK_TICKETS).find(
      (ticket) => ticket.id === ticketId,
    ) ?? null)
  );
}

export async function updateOrganizerTicket(
  token: string | undefined,
  ticketId: string,
  input: BackendUpdateTicketInput,
): Promise<BackendTicket | null> {
  if (!token) {
    const ticket = FALLBACK_TICKETS.find((entry) => entry.id === ticketId);
    if (!ticket) {
      return null;
    }

    return {
      ...ticket,
      status: input.status ?? ticket.status,
      gate: input.gate === undefined ? ticket.gate : input.gate,
    };
  }

  const payload = await requestJson<{ ticket: BackendTicket }>(
    `/organizer/tickets/${ticketId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    token,
  );
  return payload?.ticket ?? null;
}

export async function scanOrganizerTicket(
  token: string | undefined,
  code: string,
  gate?: string,
  source: 'qr' | 'manual' = 'qr',
): Promise<BackendOrganizerTicketScanResult | null> {
  if (!token) {
    const ticket = FALLBACK_TICKETS.find((entry) => entry.code === code.trim()) ?? null;
    if (!ticket) {
      return { outcome: 'not_found', ticket: null };
    }
    if (ticket.status === 'cancelled') {
      return { outcome: 'cancelled', ticket };
    }
    if (ticket.status === 'used') {
      return { outcome: 'already_used', ticket };
    }
    return {
      outcome: 'checked_in',
      ticket: {
        ...ticket,
        status: 'used',
        gate: gate?.trim() || 'Main Gate',
      },
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/tickets/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code, gate, source }),
    });

    const payload = (await response.json().catch(() => null)) as { result?: BackendOrganizerTicketScanResult } | null;
    return payload?.result ?? null;
  } catch {
    return null;
  }
}

export async function getOrganizerScanStats(token?: string, organizerId?: string): Promise<BackendOrganizerScanStats> {
  if (!token) {
    const tickets = organizerId
      ? FALLBACK_TICKETS.filter((ticket) => ticket.event.organizerId === organizerId)
      : FALLBACK_TICKETS;
    const validTickets = tickets.filter((ticket) => ticket.status === 'valid').length;
    const usedTickets = tickets.filter((ticket) => ticket.status === 'used').length;
    const queued = organizerId ? FALLBACK_EVENTS.filter((event) => event.organizerId === organizerId).length : 0;
    const byTierMap = new Map<string, BackendOrganizerScanTierStat>();

    for (const ticket of tickets) {
      const tier = ticket.event.tiers?.find((entry) => entry.key === 'vip' && ticket.seat.toLowerCase().includes('vip'))
        ?? ticket.event.tiers?.find((entry) => entry.key === 'standard')
        ?? { key: 'standard', name: 'Standard' };
      const current =
        byTierMap.get(tier.key) ??
        {
          tierKey: tier.key,
          tierName: tier.name,
          totalTickets: 0,
          scannedTickets: 0,
          pendingTickets: 0,
          cancelledTickets: 0,
        };

      current.totalTickets += 1;
      if (ticket.status === 'used') current.scannedTickets += 1;
      if (ticket.status === 'valid') current.pendingTickets += 1;
      if (ticket.status === 'cancelled') current.cancelledTickets += 1;
      byTierMap.set(tier.key, current);
    }

    return {
      pending: validTickets,
      queued,
      scans: tickets.length > 0 ? Math.round((usedTickets / tickets.length) * 100) : 0,
      totalTickets: tickets.length,
      validTickets,
      usedTickets,
      byTier: Array.from(byTierMap.values()).sort((a, b) => b.totalTickets - a.totalTickets || a.tierName.localeCompare(b.tierName)),
    };
  }

  const payload = await requestJson<{ stats: BackendOrganizerScanStats }>('/organizer/scan-stats', {}, token);
  if (payload?.stats) {
    return payload.stats;
  }

  const tickets = organizerId
    ? FALLBACK_TICKETS.filter((ticket) => ticket.event.organizerId === organizerId)
    : FALLBACK_TICKETS;
  const validTickets = tickets.filter((ticket) => ticket.status === 'valid').length;
  const usedTickets = tickets.filter((ticket) => ticket.status === 'used').length;
  return {
    pending: validTickets,
    queued: organizerId ? FALLBACK_EVENTS.filter((event) => event.organizerId === organizerId).length : 0,
    scans: tickets.length > 0 ? Math.round((usedTickets / tickets.length) * 100) : 0,
    totalTickets: tickets.length,
    validTickets,
    usedTickets,
    byTier: [
      {
        tierKey: 'standard',
        tierName: 'Standard',
        totalTickets: tickets.length,
        scannedTickets: usedTickets,
        pendingTickets: validTickets,
        cancelledTickets: tickets.filter((ticket) => ticket.status === 'cancelled').length,
      },
    ],
  };
}

export async function getOrganizerDashboardStats(token?: string, organizerId?: string): Promise<BackendOrganizerDashboardStats> {
  if (!token) {
    const events = organizerId ? FALLBACK_EVENTS.filter((event) => event.organizerId === organizerId) : FALLBACK_EVENTS;
    const tickets = organizerId
      ? FALLBACK_TICKETS.filter((ticket) => ticket.event.organizerId === organizerId)
      : FALLBACK_TICKETS;
    const sales = tickets.length;
    const usedTickets = tickets.filter((ticket) => ticket.status === 'used').length;
    return {
      sales,
      events: events.length,
      cities: groupEventsByCity(events).length,
      scanRate: sales > 0 ? Math.round((usedTickets / sales) * 100) : 0,
    };
  }

  const payload = await requestJson<{ stats: BackendOrganizerDashboardStats }>('/organizer/dashboard', {}, token);
  if (payload?.stats) {
    return payload.stats;
  }

  const events = organizerId ? FALLBACK_EVENTS.filter((event) => event.organizerId === organizerId) : FALLBACK_EVENTS;
  const tickets = organizerId
    ? FALLBACK_TICKETS.filter((ticket) => ticket.event.organizerId === organizerId)
    : FALLBACK_TICKETS;
  const sales = tickets.length;
  const usedTickets = tickets.filter((ticket) => ticket.status === 'used').length;
  return {
    sales,
    events: events.length,
    cities: groupEventsByCity(events).length,
    scanRate: sales > 0 ? Math.round((usedTickets / sales) * 100) : 0,
  };
}

export async function getOrganizerDashboard(token?: string, organizerId?: string): Promise<BackendOrganizerDashboard> {
  if (!token) {
    const stats = await getOrganizerDashboardStats(token, organizerId);
    return {
      stats,
      timeline: [
        { label: '2026-06', sales: 3 },
        { label: '2026-07', sales: 5 },
      ],
      topCities: groupEventsByCity(
        organizerId ? FALLBACK_EVENTS.filter((event) => event.organizerId === organizerId) : FALLBACK_EVENTS,
      )
        .slice(0, 5)
        .map((entry) => ({ city: entry.label, tickets: entry.count })),
      funnel: {
        views: 180,
        checkouts: 42,
        purchases: stats.sales,
        dropOffRate: 77,
      },
      eventPerformance: (organizerId ? FALLBACK_EVENTS.filter((event) => event.organizerId === organizerId) : FALLBACK_EVENTS).map((event) => ({
        eventId: event.id,
        published: event.status !== 'draft',
        grossSales: event.price === 'Gratuit' ? 0 : Number(event.price.replace(/[^\d]/g, '')) || 0,
        ticketsSold: FALLBACK_TICKETS.filter((ticket) => ticket.event.id === event.id).length,
        waitlistCount: event.tiers?.some((tier) => tier.waitlistEnabled && tier.inventoryRemaining === 0) ? 3 : 0,
      })),
    };
  }

  const payload = await requestJson<BackendOrganizerDashboard>('/organizer/dashboard', {}, token);
  return payload ?? (await getOrganizerDashboard(undefined, organizerId));
}

export async function searchEvents(query = '', token?: string): Promise<BackendSearchResponse> {
  const payload = await requestJson<BackendSearchResponse>(
    `/events/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`,
    {},
    token,
  );

  const results = payload?.results ?? sortEventsByDate(FALLBACK_EVENTS).map((event, index) => ({
    ...event,
    score: FALLBACK_EVENTS.length - index,
    matchedFields: ['all'],
  }));

  return {
    query: payload?.query ?? query,
    queryWords: payload?.queryWords ?? query.split(/\s+/g).filter(Boolean),
    normalizedQuery: payload?.normalizedQuery ?? query.trim().toLowerCase(),
    suggestions: payload?.suggestions ?? [],
    results,
    recentSearches: payload?.recentSearches ?? [],
    followedOrganizerEvents: payload?.followedOrganizerEvents ?? [],
    facets:
      payload?.facets ?? {
        categories: Array.from(
          new Map(FALLBACK_EVENTS.map((event) => [event.category, 0] as const)).keys(),
        ).map((label) => ({
          label,
          count: FALLBACK_EVENTS.filter((event) => event.category === label).length,
        })),
        cities: groupEventsByCity(FALLBACK_EVENTS).map((group) => ({
          label: group.label,
          count: group.count,
        })),
      },
  };
}

export async function getHomeData(token?: string, city?: string): Promise<BackendHomeFeed> {
  const params = new URLSearchParams();
  if (city?.trim()) params.set('city', city.trim());
  const payload = await requestJson<BackendHomeFeed>(`/events/home${params.size ? `?${params.toString()}` : ''}`, {}, token);
  const fallbackEvents = sortEventsByDate(FALLBACK_EVENTS);

  return {
    featuredEvents: payload?.featuredEvents ?? fallbackEvents.slice(0, 3),
    upcomingEvents: payload?.upcomingEvents ?? fallbackEvents.slice(3),
    categories:
      payload?.categories ?? ['all', ...Array.from(new Set(fallbackEvents.map((event) => event.category.toLowerCase())))],
    trendingEvents: payload?.trendingEvents ?? fallbackEvents.slice(0, 4),
    recommendedEvents: payload?.recommendedEvents ?? fallbackEvents.slice(0, 4).map((event) => ({ ...event, recommendationReason: 'Popular with attendees like you' })),
    becauseYouLiked: payload?.becauseYouLiked ?? fallbackEvents.slice(1, 4).map((event) => ({ ...event, recommendationReason: 'Because you liked similar live events' })),
    recentSearches: payload?.recentSearches ?? [],
    followedOrganizerEvents: payload?.followedOrganizerEvents ?? [],
    nearbyEvents: payload?.nearbyEvents ?? fallbackEvents.slice(0, 6),
  };
}

export async function listProviderDirectory(input: {
  city?: string;
  commune?: string;
  query?: string;
} = {}): Promise<BackendProviderDirectoryResponse> {
  const params = new URLSearchParams();
  if (input.city?.trim()) params.set('city', input.city.trim());
  if (input.commune?.trim()) params.set('commune', input.commune.trim());
  if (input.query?.trim()) params.set('q', input.query.trim());

  const payload = await requestJson<BackendProviderDirectoryResponse>(
    `/providers${params.size ? `?${params.toString()}` : ''}`,
  );

  return payload ?? buildFallbackProviderDirectory(input.city, input.commune, input.query);
}

export async function listVenues(): Promise<BackendVenue[]> {
  const payload = await requestJson<{ venues: BackendVenue[] }>('/venues');
  return payload?.venues ?? FALLBACK_VENUES;
}

export async function getEvent(id: string): Promise<BackendEvent | null> {
  const payload = await requestJson<{ event: BackendEvent }>(`/events/${id}`);
  return payload?.event ?? FALLBACK_EVENTS.find((event) => event.id === id) ?? null;
}

export async function listTickets(token?: string): Promise<BackendTicket[]> {
  if (!token) return FALLBACK_TICKETS;
  const payload = await requestJson<{ tickets: BackendTicket[] }>('/tickets', {}, token);
  return payload?.tickets ?? FALLBACK_TICKETS;
}

export async function listSavedEvents(token?: string): Promise<BackendSavedEvent[]> {
  if (!token) return [];
  const payload = await requestJson<{ savedEvents: BackendSavedEvent[] }>('/saved', {}, token);
  return payload?.savedEvents ?? [];
}

export async function saveEvent(eventId: string, token?: string): Promise<BackendSavedEvent | null> {
  if (!token) {
    return null;
  }

  const payload = await requestJson<{ savedEvent: BackendSavedEvent }>(
    `/saved/${eventId}`,
    {
      method: 'POST',
    },
    token,
  );

  return payload?.savedEvent ?? null;
}

export async function unsaveEvent(eventId: string, token?: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  const response = await fetch(`${API_BASE_URL}/saved/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.ok;
}

export async function getTicket(id: string, token?: string): Promise<BackendTicket | null> {
  if (!token) return FALLBACK_TICKETS.find((ticket) => ticket.id === id) ?? null;
  const payload = await requestJson<{ ticket: BackendTicket }>(`/tickets/${id}`, {}, token);
  return payload?.ticket ?? FALLBACK_TICKETS.find((ticket) => ticket.id === id) ?? null;
}

export async function reserveTicket(
  eventId: string,
  tier: string,
  token?: string,
): Promise<BackendTicket | null> {
  if (!token) {
    return null;
  }

  const payload = await requestJson<BackendReserveResponse>(
    '/tickets/reserve',
    {
      method: 'POST',
      body: JSON.stringify({ eventId, tier }),
    },
    token,
  );

  if (payload?.ticket) {
    notifyLiveRefresh();
  }

  return payload?.ticket ?? null;
}

export async function quoteTicketReservation(
  eventId: string,
  tierKey: string,
  quantity: number,
  promoCode?: string,
  token?: string,
): Promise<BackendReservationQuote | null> {
  if (!token) {
    const event = FALLBACK_EVENTS.find((entry) => entry.id === eventId);
    const tier = event?.tiers?.find((entry) => entry.key === tierKey);
    if (!tier) {
      return null;
    }
    const subtotal = tier.priceCents * quantity;
    const discount = promoCode?.trim().toUpperCase() === 'WELCOME10' ? Math.round(subtotal * 0.1) : 0;
    return {
      tierKey,
      quantity,
      subtotal,
      discount,
      total: Math.max(subtotal - discount, 0),
      promoApplied: discount > 0 ? promoCode!.trim().toUpperCase() : null,
      remainingAfterPurchase: Math.max(tier.inventoryRemaining - quantity, 0),
      status: tier.inventoryRemaining <= 0 ? (tier.waitlistEnabled ? 'waitlist_only' : 'sold_out') : 'available',
    };
  }

  const payload = await requestJson<{ quote: BackendReservationQuote }>(
    '/tickets/quote',
    {
      method: 'POST',
      body: JSON.stringify({ eventId, tierKey, quantity, promoCode }),
    },
    token,
  );

  return payload?.quote ?? null;
}

export async function reserveTickets(
  eventId: string,
  tierKey: string,
  quantity: number,
  promoCode?: string,
  token?: string,
): Promise<BackendReservationResult | null> {
  if (!token) {
    return null;
  }

  const payload = await requestJson<{ reservation: BackendReservationResult }>(
    '/tickets/reserve',
    {
      method: 'POST',
      body: JSON.stringify({ eventId, tierKey, quantity, promoCode }),
    },
    token,
  );

  if (payload?.reservation) {
    notifyLiveRefresh();
  }

  return payload?.reservation ?? null;
}

export async function listNotifications(token?: string): Promise<BackendNotification[]> {
  if (!token) {
    return FALLBACK_NOTIFICATIONS;
  }

  const payload = await requestJson<{ notifications: BackendNotification[] }>('/notifications', {}, token);
  return payload?.notifications ?? FALLBACK_NOTIFICATIONS;
}

export async function markNotificationRead(notificationId: string, token?: string): Promise<BackendNotification | null> {
  if (!token) {
    const notification = FALLBACK_NOTIFICATIONS.find((entry) => entry.id === notificationId);
    return notification ? { ...notification, readAt: new Date().toISOString() } : null;
  }

  const payload = await requestJson<{ notification: BackendNotification }>(
    `/notifications/${notificationId}/read`,
    { method: 'PATCH' },
    token,
  );
  return payload?.notification ?? null;
}

export async function followOrganizer(organizerId: string, token?: string): Promise<boolean> {
  if (!token) {
    return true;
  }

  const payload = await requestJson<{ ok: boolean }>(
    '/discovery/follows/organizers',
    {
      method: 'POST',
      body: JSON.stringify({ organizerId }),
    },
    token,
  );
  return payload?.ok === true;
}

export async function followCategory(category: string, token?: string): Promise<boolean> {
  if (!token) {
    return true;
  }

  const payload = await requestJson<{ ok: boolean }>(
    '/discovery/follows/categories',
    {
      method: 'POST',
      body: JSON.stringify({ category }),
    },
    token,
  );
  return payload?.ok === true;
}

export async function createCheckoutSession(
  eventId: string,
  tier: string,
  paymentMethod: BackendPaymentMethodKey,
  quantity = 1,
  promoCode?: string,
  token?: string,
): Promise<BackendCheckoutSession | null> {
  if (!token) {
    return null;
  }

  const payload = await requestJson<{ session: BackendCheckoutSession }>(
    '/payments/checkout-sessions',
    {
      method: 'POST',
      body: JSON.stringify({ eventId, tier, paymentMethod, quantity, promoCode }),
    },
    token,
  );

  return payload?.session ?? null;
}

export async function getCheckoutSession(sessionId: string, token?: string): Promise<BackendCheckoutSession | null> {
  if (!token) {
    return null;
  }

  const payload = await requestJson<{ session: BackendCheckoutSession }>(`/payments/checkout-sessions/${sessionId}`, {}, token);
  return payload?.session ?? null;
}

export async function initiateMobileMoneyPayment(
  input: { checkoutSessionId: string; network: string; phoneNumber: string; countryCode: string; currency: string; omOtp?: string },
  token?: string,
): Promise<BackendMobileMoneyTransaction | null> {
  if (!token) return null;
  const payload = await requestJsonOrThrow<{ transaction: BackendMobileMoneyTransaction }>(
    '/payments/mobile-money/initiate',
    { method: 'POST', body: JSON.stringify(input) },
    token,
  );
  return payload?.transaction ?? null;
}

export async function getMobileMoneyTransaction(id: string, token?: string): Promise<BackendMobileMoneyTransaction | null> {
  if (!token) return null;
  const payload = await requestJson<{ transaction: BackendMobileMoneyTransaction }>(`/payments/mobile-money/${id}`, {}, token);
  return payload?.transaction ?? null;
}

export async function getMobileMoneyOptions(token?: string): Promise<MobileMoneyCountryOption[]> {
  if (!token) return [];
  const payload = await requestJsonOrThrow<{ countries: MobileMoneyCountryOption[] }>(
    '/payments/mobile-money/options',
    {},
    token,
  );
  return payload.countries;
}

export async function getLatestMobileMoneyTransactionForCheckout(checkoutSessionId: string, token?: string): Promise<BackendMobileMoneyTransaction | null> {
  if (!token) return null;
  const payload = await requestJsonOrThrow<{ transaction: BackendMobileMoneyTransaction | null }>(
    `/payments/mobile-money/checkout/${checkoutSessionId}`,
    {},
    token,
  );
  return payload.transaction;
}

export async function refreshMobileMoneyTransaction(id: string, token?: string): Promise<BackendMobileMoneyTransaction | null> {
  if (!token) return null;
  const payload = await requestJsonOrThrow<{ transaction: BackendMobileMoneyTransaction }>(`/payments/mobile-money/${id}/refresh`, {}, token);
  return payload?.transaction ?? null;
}

export async function finalizeMobileMoneyPayment(id: string, otp: string, token?: string): Promise<BackendMobileMoneyTransaction | null> {
  if (!token) return null;
  const payload = await requestJsonOrThrow<{ transaction: BackendMobileMoneyTransaction }>(
    `/payments/mobile-money/${id}/finalize`,
    { method: 'POST', body: JSON.stringify({ otp }) },
    token,
  );
  return payload?.transaction ?? null;
}

export async function getMerchantAccount(
  organizerId: string,
  paymentMethod: BackendPaymentMethodKey,
  token?: string,
): Promise<BackendMerchantAccount | null> {
  if (!token) {
    return null;
  }

  const payload = await requestJson<{ merchantAccount: BackendMerchantAccount }>(
    `/payments/merchant-accounts/${organizerId}?paymentMethod=${paymentMethod}`,
    {},
    token,
  );
  return payload?.merchantAccount ?? null;
}

export async function updateMerchantAccount(
  organizerId: string,
  paymentMethod: BackendPaymentMethodKey,
  input: Record<string, string>,
  token?: string,
): Promise<BackendMerchantAccount | null> {
  if (!token) {
    return null;
  }

  const payload = await requestJson<{ merchantAccount: BackendMerchantAccount }>(
    `/payments/merchant-accounts/${organizerId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ paymentMethod, ...input }),
    },
    token,
  );
  return payload?.merchantAccount ?? null;
}

export async function getMe(token?: string): Promise<BackendUser | null> {
  if (!token) return null;
  const payload = await requestJson<{ user: BackendUser }>('/auth/me', {}, token);
  return payload?.user ?? null;
}

export async function getProfileSummary(token?: string): Promise<BackendProfileSummary> {
  if (!token) {
    const fallbackSpend = FALLBACK_TICKETS.reduce((sum, ticket) => {
      const price = ticket.event.price.replace(/[^\d]/g, '');
      return sum + (price ? Number(price) : 0);
    }, 0);
    return {
      user: FALLBACK_USER,
      stats: {
        ticketsPurchased: FALLBACK_TICKETS.length,
        eventsFollowed: FALLBACK_TICKETS.length,
        citiesVisited: new Set(FALLBACK_TICKETS.map((ticket) => ticket.event.location)).size,
        totalSpend: fallbackSpend,
      },
    };
  }

  const payload = await requestJson<BackendProfileSummary>('/auth/profile', {}, token);
  return (
    payload ?? {
      user: FALLBACK_USER,
      stats: {
        ticketsPurchased: FALLBACK_TICKETS.length,
        eventsFollowed: FALLBACK_TICKETS.length,
        citiesVisited: new Set(FALLBACK_TICKETS.map((ticket) => ticket.event.location)).size,
        totalSpend: FALLBACK_TICKETS.reduce((sum, ticket) => {
          const price = ticket.event.price.replace(/[^\d]/g, '');
          return sum + (price ? Number(price) : 0);
        }, 0),
      },
    }
  );
}

export async function updateProfile(
  input: { name: string; email: string },
  token?: string,
): Promise<BackendUser | null> {
  if (!token) {
    return {
      ...FALLBACK_USER,
      name: input.name.trim() || FALLBACK_USER.name,
      email: input.email.trim() || FALLBACK_USER.email,
    };
  }

  const payload = await requestJsonOrThrow<{ user: BackendUser }>(
    '/auth/profile',
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    token,
  );

  return payload?.user ?? null;
}

export async function requestPasswordReset(email: string): Promise<boolean> {
  const payload = await requestJsonOrThrow<{ ok: boolean }>(
    '/auth/password-reset/request',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
  );

  return payload?.ok === true;
}

export async function confirmPasswordReset(token: string, password: string): Promise<boolean> {
  const payload = await requestJsonOrThrow<{ ok: boolean }>(
    '/auth/password-reset/confirm',
    { method: 'POST', body: JSON.stringify({ token, password }) },
  );
  return payload?.ok === true;
}

export async function deleteAccount(password: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/account`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
  if (response.ok) return;

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  throw new Error(payload?.error?.trim() || 'Suppression impossible');
}

export async function login(email: string, password: string): Promise<{ token: string; user: BackendUser } | null> {
  return requestJsonOrThrow('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }) as Promise<{
    token: string;
    user: BackendUser;
  }>;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<{ token: string; user: BackendUser } | null> {
  return requestJsonOrThrow('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }) as Promise<{
    token: string;
    user: BackendUser;
  }>;
}

export async function devLogin(
  role: BackendUser['role'] = 'attendee',
  email?: string,
): Promise<{ token: string; user: BackendUser } | null> {
  return requestJsonOrThrow('/auth/dev-login', { method: 'POST', body: JSON.stringify({ role, email }) }) as Promise<{
    token: string;
    user: BackendUser;
  }>;
}

export { FALLBACK_EVENTS, FALLBACK_TICKETS, FALLBACK_USER };
