import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { countCities } from './cities';
import { buildVenueImageUrl } from './venue-image';
import {
  seedData,
  type SeedEvent,
  type SeedVenue,
  type SeedData,
} from '../seed';
import type { Event, MerchantAccount, PaymentMethodKey, Ticket, User, ProviderUser, CheckoutSession } from '../data';
import { seedDatabase as refreshSeedDatabase } from './seed-database';
import type { MbiYoTransaction } from './mbiyopay';
import { findProviderTransaction, normalizeProviderStatus, preservePaymentStatus, providerAmountMatches, type PaymentStatus } from './payment-state';

type VenueRecord = SeedVenue;

export type PublicTicket = Ticket & {
  event: Event;
  holderName: string;
};

export type PublicSavedEvent = {
  event: Event;
  createdAt: string;
};

export type MerchantField = {
  key: 'businessName' | 'supportEmail' | 'country' | 'city' | 'phoneNumber' | 'payoutDetails';
  label: string;
  placeholder: string;
  value: string;
};

export type PublicMerchantAccount = {
  organizerId: string;
  provider: PaymentMethodKey;
  providerName: string;
  status: 'needs_info' | 'ready';
  fields: MerchantField[];
  setupPath: string;
};

export type PublicCheckoutSession = CheckoutSession & {
  amountLabel: string;
  event: Event;
  merchantAccount: PublicMerchantAccount;
  providerName: string;
};

export type PublicMobileMoneyTransaction = {
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

export type OrganizerScanStats = {
  pending: number;
  queued: number;
  scans: number;
  totalTickets: number;
  validTickets: number;
  usedTickets: number;
  byTier: OrganizerScanTierStats[];
};

export type OrganizerScanTierStats = {
  tierKey: string;
  tierName: string;
  totalTickets: number;
  scannedTickets: number;
  pendingTickets: number;
  cancelledTickets: number;
};

export type OrganizerDashboardStats = {
  sales: number;
  events: number;
  cities: number;
  scanRate: number;
  payoutStatus?: 'ready' | 'needs_attention';
};

export type ReservationQuote = {
  tierKey: string;
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
  promoApplied: string | null;
  remainingAfterPurchase: number;
  status: 'available' | 'sold_out' | 'waitlist_only';
};

export type ReservationResult = {
  status: 'confirmed' | 'waitlisted';
  tickets: PublicTicket[];
  waitlistEntryId: string | null;
};

export type AppNotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  data: { url?: string };
};

export type OrganizerDashboardPayload = {
  stats: OrganizerDashboardStats;
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
};

export type ProfileSummary = {
  user: PublicUser;
  stats: {
    ticketsPurchased: number;
    eventsFollowed: number;
    citiesVisited: number;
    totalSpend: number;
  };
};

export type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'avatarUrl' | 'totalSpend'>;

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  name: string;
  role?: User['role'];
};

export type UpdateUserProfileInput = {
  email?: string;
  name?: string;
};

export type UpdateEventInput = {
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
  lineup?: Array<{ time: string; title: string; stage: string }>;
  tiers?: Array<{
    key: string;
    name: string;
    price: string;
    inventoryTotal: number;
    maxPerOrder: number;
    waitlistEnabled: boolean;
    perks: string[];
  }>;
  promoCodes?: Array<{
    code: string;
    discountType: 'percent' | 'amount';
    discountValue: number;
    maxUses: number;
    tierKey?: string | null;
  }>;
};

export type CreateEventInput = {
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
  lineup?: Array<{ time: string; title: string; stage: string }>;
  tiers?: Array<{
    key: string;
    name: string;
    price: string;
    inventoryTotal: number;
    maxPerOrder: number;
    waitlistEnabled: boolean;
    perks: string[];
  }>;
  promoCodes?: Array<{
    code: string;
    discountType: 'percent' | 'amount';
    discountValue: number;
    maxUses: number;
    tierKey?: string | null;
  }>;
};

export type UpdateMerchantAccountInput = {
  businessName?: string;
  supportEmail?: string;
  country?: string;
  city?: string;
  phoneNumber?: string;
  payoutDetails?: string;
};

export type UpdateOrganizerTicketInput = {
  status?: Ticket['status'];
  gate?: string | null;
};

export type OrganizerTicketScanResult = {
  outcome: 'checked_in' | 'already_used' | 'cancelled' | 'not_found';
  ticket: PublicTicket | null;
  scan?: OrganizerTicketScanAudit;
};

export type OrganizerTicketScanAudit = {
  id: string;
  scannedAt: string;
  gate: string;
  scannerId: string;
  scannerName: string;
  scannerRole: string;
  source: 'qr' | 'manual';
  outcome: OrganizerTicketScanResult['outcome'];
};

export type ProviderDirectoryResponse = {
  providers: ProviderUser[];
  coverage: Array<{ commune: string; providers: ProviderUser[] }>;
  facets: {
    cities: { label: string; count: number }[];
    communes: { label: string; count: number }[];
  };
  stats: {
    total: number;
    coveredCommunes: number;
  };
};

const moduleRoot = resolve(__dirname, '..', '..');
const detectedServerRoot = basename(moduleRoot) === 'dist' ? dirname(moduleRoot) : moduleRoot;
const SERVER_ROOT = resolve(process.env.YOTICKS_SERVER_ROOT ?? detectedServerRoot);
const SERVER_PRISMA_DIR = resolve(SERVER_ROOT, 'prisma');
const DEFAULT_DB_FILE = process.env.YOTICKS_DB_FILE
  ? resolve(process.env.YOTICKS_DB_FILE)
  : resolve(SERVER_ROOT, 'prisma', 'dev.db');
const PRISMA_BIN = resolve(SERVER_ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
const preparedDatabases = new Set<string>();
const PROVIDER_NAMES: Record<PaymentMethodKey, string> = {
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  paypal: 'PayPal',
  card: 'Carte bancaire',
  mbiyopay_mobile_money: 'Mobile money',
};
const MERCHANT_FIELD_DEFS: Array<Omit<MerchantField, 'value'>> = [
  { key: 'businessName', label: 'Nom du commerce', placeholder: 'Dakar Nights SARL' },
  { key: 'supportEmail', label: 'Email support', placeholder: 'payments@dakarnights.sn' },
  { key: 'country', label: 'Pays', placeholder: 'Senegal' },
  { key: 'city', label: 'Ville', placeholder: 'Dakar' },
  { key: 'phoneNumber', label: 'Telephone', placeholder: '+221 77 000 00 00' },
  { key: 'payoutDetails', label: 'Versement', placeholder: 'Compte bancaire ou wallet marchand' },
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parsePrice(price: string) {
  const value = Number(price.replace(/[^\d]/g, ''));
  return Number.isFinite(value) ? value : 0;
}

function optionalFiniteNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(amount: number) {
  return `${amount.toLocaleString('fr-FR')} FC`;
}

function checkoutAmountForTier(event: Event, tier: string) {
  const basePrice = parsePrice(event.price);
  const normalizedTier = tier.trim().toLowerCase();

  if (normalizedTier === 'vip') {
    return basePrice === 0 ? 5000 : Math.round(basePrice * 1.8);
  }

  if (normalizedTier === 'plus' || normalizedTier === 'premium') {
    return basePrice === 0 ? 1500 : Math.round(basePrice * 1.25);
  }

  return basePrice;
}

function yearFromDate(date: string) {
  const match = date.match(/(\d{4})$/);
  return match ? match[1] : String(new Date().getFullYear());
}

function formatTicketCode(eventId: string, ticketNumber: number, year: string) {
  return `YT-${year}-${eventId.padStart(2, '0')}-${String(ticketNumber).padStart(3, '0')}`;
}

function formatSeat(eventId: string, tier: string, ticketNumber: number) {
  const prefix =
    tier === 'vip' ? 'VIP' : tier === 'premium' ? 'PREM' : tier === 'standard' ? 'STD' : eventId.toUpperCase();
  return `${prefix}-${String(ticketNumber).padStart(2, '0')}`;
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCategoryLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

function defaultEventColor(category: string) {
  switch (normalizeCategoryLabel(category)) {
    case 'concerts':
      return '#F99F22';
    case 'conferences':
    case 'conference':
      return '#3C9449';
    case 'soirees':
      return '#D71F27';
    case 'sport':
      return '#3C9449';
    case 'festivals':
      return '#D71F27';
    case 'workshops':
      return '#4A6FB3';
    case 'meetups':
      return '#FFC516';
    default:
      return '#F99F22';
  }
}

function parseLocationParts(location: string) {
  const [rawCity = '', rawCountry = ''] = location.split(',');
  const city = rawCity.trim() || location.trim();
  const country = rawCountry.trim();
  return { city, country };
}

function venueNameFromEventTitle(title: string) {
  const trimmed = title.trim();
  return trimmed.toLowerCase().includes('venue') ? trimmed : `${trimmed} Venue`;
}

function buildVenueImage(seed: string, title: string, location: string, category: string) {
  const { city } = parseLocationParts(location);
  return buildVenueImageUrl({
    seed,
    title,
    city,
    category,
  });
}

function buildEventImage(seed: string, title: string, location: string, category: string, accent?: string) {
  const { city } = parseLocationParts(location);
  return buildVenueImageUrl({
    seed,
    title,
    city,
    category,
    accent,
  });
}

function extractTicketCode(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const qrMatch = trimmed.match(/yoticks-ticket:([^|]+)/i);
  return (qrMatch?.[1] ?? trimmed).trim();
}

function publicTicketScan(scan: {
  id: string;
  scannedAt: Date;
  gate: string;
  scannerId: string;
  scannerName: string;
  scannerRole: string;
  source: string;
  outcome: string;
}): OrganizerTicketScanAudit {
  return {
    id: scan.id,
    scannedAt: scan.scannedAt.toISOString(),
    gate: scan.gate,
    scannerId: scan.scannerId,
    scannerName: scan.scannerName,
    scannerRole: scan.scannerRole,
    source: scan.source === 'manual' ? 'manual' : 'qr',
    outcome: scan.outcome as OrganizerTicketScanResult['outcome'],
  };
}

function publicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    totalSpend: user.totalSpend,
  };
}

function makePublicEvent(event: {
  id: string;
  organizerId: string | null;
  title: string;
  date: string;
  location: string;
  category: string;
  price: string;
  description: string;
  organizer: string;
  color: string;
  imageUrl: string;
  status?: string;
  coverImageUrl?: string | null;
  venueMapUrl?: string | null;
  galleryImages?: Array<{ url: string; sortOrder: number }>;
  lineupItems?: Array<{ time: string; title: string; stage: string }>;
  tiers?: Array<{
    key: string;
    name: string;
    priceLabel: string;
    priceCents: number;
    inventoryTotal: number;
    inventorySold: number;
    maxPerOrder: number;
    waitlistEnabled: boolean;
    perks: string;
  }>;
}) {
  const organizerId = event.organizerId ?? undefined;
  return {
    id: event.id,
    organizerId,
    title: event.title,
    date: event.date,
    location: event.location,
    category: event.category,
    price: event.price,
    description: event.description,
    organizer: event.organizer,
    color: event.color,
    imageUrl: event.imageUrl,
    status: (event.status as Event['status']) ?? 'published',
    coverImageUrl: event.coverImageUrl ?? event.imageUrl,
    venueMapUrl: event.venueMapUrl ?? null,
    galleryImageUrls: (event.galleryImages ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => image.url),
    lineup: (event.lineupItems ?? []).map((item) => ({
      time: item.time,
      title: item.title,
      stage: item.stage,
    })),
    tiers: (event.tiers ?? []).map((tier) => ({
      key: tier.key,
      name: tier.name,
      price: tier.priceLabel,
      priceCents: tier.priceCents,
      inventoryTotal: tier.inventoryTotal,
      inventoryRemaining: Math.max(tier.inventoryTotal - tier.inventorySold, 0),
      maxPerOrder: tier.maxPerOrder,
      waitlistEnabled: tier.waitlistEnabled,
      perks: safeJsonParseStringArray(tier.perks),
    })),
  } satisfies Event;
}

function makePublicMerchantFields(
  account:
    | {
        businessName: string;
        supportEmail: string;
        country: string;
        city: string;
        phoneNumber: string;
        payoutDetails: string;
      }
    | null,
) {
  const source = account ?? {
    businessName: '',
    supportEmail: '',
    country: '',
    city: '',
    phoneNumber: '',
    payoutDetails: '',
  };

  return MERCHANT_FIELD_DEFS.map((field) => ({
    ...field,
    value: source[field.key] ?? '',
  }));
}

function makeDefaultMerchantAccount(organizerId: string, provider: PaymentMethodKey): PublicMerchantAccount {
  return {
    organizerId,
    provider,
    providerName: PROVIDER_NAMES[provider],
    status: 'needs_info',
    fields: makePublicMerchantFields(null),
    setupPath: `/(organizer)/payouts?organizerId=${encodeURIComponent(organizerId)}&paymentMethod=${provider}`,
  };
}

function makePublicMerchantAccount(account: {
  organizerId: string;
  provider: string;
  businessName: string;
  supportEmail: string;
  country: string;
  city: string;
  phoneNumber: string;
  payoutDetails: string;
  status: string;
}): PublicMerchantAccount {
  return {
    organizerId: account.organizerId,
    provider: account.provider as PaymentMethodKey,
    providerName: PROVIDER_NAMES[account.provider as PaymentMethodKey],
    status: account.status as PublicMerchantAccount['status'],
    fields: makePublicMerchantFields(account),
    setupPath: `/(organizer)/payouts?organizerId=${encodeURIComponent(account.organizerId)}&paymentMethod=${account.provider}`,
  };
}

function makePublicTicket(ticket: {
  id: string;
  userId: string;
  eventId: string;
  seat: string;
  code: string;
  status: string;
  holderName: string;
  gate: string | null;
  tierKey?: string;
  pricePaid?: number;
  event: ReturnType<typeof makePublicEvent>;
}) {
  return {
    id: ticket.id,
    userId: ticket.userId,
    eventId: ticket.eventId,
    seat: ticket.seat,
    code: ticket.code,
    status: ticket.status as Ticket['status'],
    gate: ticket.gate,
    tierKey: ticket.tierKey ?? 'standard',
    pricePaid: ticket.pricePaid ?? 0,
    event: ticket.event,
    holderName: ticket.holderName,
  } satisfies PublicTicket;
}

function makePublicCheckoutSession(session: {
  id: string;
  userId: string;
  eventId: string;
  organizerId: string;
  tier: string;
  paymentMethod: PaymentMethodKey;
  amount: number;
  quantity: number;
  status: string;
  createdAt: Date;
  event: ReturnType<typeof makePublicEvent>;
  merchantAccount?: {
    organizerId: string;
    provider: string;
    businessName: string;
    supportEmail: string;
    country: string;
    city: string;
    phoneNumber: string;
    payoutDetails: string;
    status: string;
  };
}) {
  const merchantAccount = session.merchantAccount ? makePublicMerchantAccount(session.merchantAccount) : makeDefaultMerchantAccount(session.organizerId, session.paymentMethod);

  return {
    id: session.id,
    userId: session.userId,
    eventId: session.eventId,
    organizerId: session.organizerId,
    tier: session.tier,
    paymentMethod: session.paymentMethod,
    amount: session.amount,
    quantity: session.quantity,
    amountLabel: session.amount === 0 ? 'Aucun paiement' : `A payer : ${formatMoney(session.amount)}`,
    status: session.status as CheckoutSession['status'],
    createdAt: session.createdAt.toISOString(),
    event: session.event,
    merchantAccount,
    providerName: PROVIDER_NAMES[session.paymentMethod],
  } satisfies PublicCheckoutSession;
}

function makePublicMobileMoneyTransaction(transaction: {
  id: string;
  checkoutSessionId: string;
  status: string;
  providerTransactionId: string | null;
  instructions: string | null;
  authMode: string | null;
  redirectUrl: string | null;
  amount: number;
  providerFee: number | null;
  chargedAmount: number | null;
  providerStatus: string | null;
  network: string;
  countryCode: string;
  currency: string;
  createdAt: Date;
  reconciliationCheckedAt: Date | null;
  reservationIssuedAt: Date | null;
}): PublicMobileMoneyTransaction {
  return {
    id: transaction.id,
    checkoutSessionId: transaction.checkoutSessionId,
    status: transaction.status as PublicMobileMoneyTransaction['status'],
    providerTransactionId: transaction.providerTransactionId,
    instructions: transaction.instructions,
    authMode: transaction.authMode as PublicMobileMoneyTransaction['authMode'],
    redirectUrl: transaction.redirectUrl,
    amount: transaction.amount,
    providerFee: transaction.providerFee,
    chargedAmount: transaction.chargedAmount,
    providerStatus: transaction.providerStatus,
    network: transaction.network,
    countryCode: transaction.countryCode,
    currency: transaction.currency,
    createdAt: transaction.createdAt.toISOString(),
    reconciliationCheckedAt: transaction.reconciliationCheckedAt?.toISOString() ?? null,
    reservationIssuedAt: transaction.reservationIssuedAt?.toISOString() ?? null,
  };
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function compareNumericIds(a: string, b: string) {
  const aNumber = Number(a);
  const bNumber = Number(b);

  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
    return aNumber - bNumber;
  }

  return a.localeCompare(b);
}

export function toDatabaseUrl(filePath: string) {
  const normalizedRelative = relative(SERVER_PRISMA_DIR, filePath).replace(/\\/g, '/');
  const normalized = normalizedRelative.startsWith('.') ? normalizedRelative : `./${normalizedRelative}`;
  return `file:${normalized}`;
}

async function ensureDatabaseSchema(dbFilePath: string) {
  if (preparedDatabases.has(dbFilePath)) {
    return;
  }

  mkdirSync(dirname(dbFilePath), { recursive: true });
  const databaseUrl = toDatabaseUrl(dbFilePath);
  const command = process.platform === 'win32' ? 'cmd.exe' : PRISMA_BIN;
  const args = process.platform === 'win32' ? ['/c', PRISMA_BIN, 'db', 'push', '--skip-generate', '--accept-data-loss'] : ['db', 'push', '--skip-generate', '--accept-data-loss'];
  execFileSync(command, args, {
    cwd: SERVER_ROOT,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: 'pipe',
  });
  preparedDatabases.add(dbFilePath);
}

export async function seedDatabase(prisma: PrismaClient, seeds: SeedData) {
  await refreshSeedDatabase(prisma, seeds);
}

function normalizeProviderQuery(value?: string) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function applyProviderFilters(providers: ProviderUser[], filters: { city?: string; commune?: string; query?: string }) {
  const normalizedCity = normalizeProviderQuery(filters.city);
  const normalizedCommune = normalizeProviderQuery(filters.commune);
  const normalizedQuery = normalizeProviderQuery(filters.query);

  return providers
    .filter((provider) => {
      if (normalizedCity && normalizeProviderQuery(provider.city) !== normalizedCity) {
        return false;
      }

      if (normalizedCommune && normalizeProviderQuery(provider.commune) !== normalizedCommune) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = normalizeProviderQuery([provider.name, provider.phone, provider.city, provider.commune].join(' '));
      return haystack.includes(normalizedQuery);
    })
    .sort((a, b) => a.city.localeCompare(b.city) || a.commune.localeCompare(b.commune) || a.name.localeCompare(b.name));
}

function buildProviderCoverage(providers: ProviderUser[]) {
  const groups = new Map<string, ProviderUser[]>();

  for (const provider of providers) {
    const current = groups.get(provider.commune) ?? [];
    current.push(provider);
    groups.set(provider.commune, current);
  }

  return Array.from(groups.entries())
    .map(([commune, communeProviders]) => ({
      commune,
      providers: communeProviders.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.providers.length - a.providers.length || a.commune.localeCompare(b.commune));
}

function buildProviderFacets(providers: ProviderUser[]) {
  const cities = new Map<string, number>();
  const communes = new Map<string, number>();

  for (const provider of providers) {
    cities.set(provider.city, (cities.get(provider.city) ?? 0) + 1);
    communes.set(provider.commune, (communes.get(provider.commune) ?? 0) + 1);
  }

  return {
    cities: Array.from(cities.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count })),
    communes: Array.from(communes.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count })),
  };
}

function safeJsonParseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function cityFromLocation(location: string) {
  return location.split(',')[0]?.trim() || location.trim();
}

function formatTierName(tierKey: string) {
  return tierKey
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function monthBucket(date: Date) {
  return date.toISOString().slice(0, 7);
}

export class DataStore {
  constructor(private readonly prisma: PrismaClient) {}

  async healthCheck(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  async close() {
    await this.prisma.$disconnect();
  }

  async listVenues(): Promise<VenueRecord[]> {
    const venues = await this.prisma.venue.findMany({
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    });

    return venues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      city: venue.city,
      country: venue.country,
      district: venue.district,
      category: venue.category,
      description: venue.description ?? '',
      imageUrl: venue.imageUrl,
    }));
  }

  async getVenue(id: string): Promise<VenueRecord | null> {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
    });

    if (!venue) {
      return null;
    }

    return {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      country: venue.country,
      district: venue.district,
      category: venue.category,
      description: venue.description ?? '',
      imageUrl: venue.imageUrl,
    };
  }

  async listEvents(): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      include: {
        galleryImages: { orderBy: { sortOrder: 'asc' } },
        lineupItems: { orderBy: { time: 'asc' } },
        tiers: { orderBy: { key: 'asc' } },
      },
      orderBy: [{ id: 'asc' }],
    });

    return events.map((event) => makePublicEvent(event));
  }

  async listEventsForOrganizer(organizerId: string): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: { organizerId },
      include: {
        galleryImages: { orderBy: { sortOrder: 'asc' } },
        lineupItems: { orderBy: { time: 'asc' } },
        tiers: { orderBy: { key: 'asc' } },
      },
      orderBy: [{ id: 'asc' }],
    });

    return events.map((event) => makePublicEvent(event));
  }

  async getEvent(id: string): Promise<Event | null> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        galleryImages: { orderBy: { sortOrder: 'asc' } },
        lineupItems: { orderBy: { time: 'asc' } },
        tiers: { orderBy: { key: 'asc' } },
      },
    });

    return event ? makePublicEvent(event) : null;
  }

  async createEvent(organizerId: string, input: CreateEventInput): Promise<Event> {
    const title = input.title.trim();
    const date = input.date.trim();
    const location = input.location.trim();
    const category = input.category.trim();
    const price = input.price.trim();
    const description = input.description.trim();
    const organizer = input.organizer?.trim() || (await this.findUserById(organizerId))?.name || 'YoTicks Organizer';
    const color = input.color?.trim() || defaultEventColor(category);
    const nextNumericId = (await this.prisma.event.count()) + 1;
    const eventId = String(nextNumericId);
    const venueId = `venue_${randomUUID()}`;
    const venueName = venueNameFromEventTitle(title);
    const { city, country } = parseLocationParts(location);
    const venueImage = buildVenueImage(`venue-${venueId}-${slugify(venueName)}`, venueName, location, category);
    const eventImage = buildEventImage(`event-${eventId}-${slugify(title)}`, title, location, category, color);
    const status = input.status ?? 'draft';
    const coverImageUrl = input.coverImageUrl?.trim() || eventImage;
    const galleryImageUrls = (input.galleryImageUrls ?? []).map((url) => url.trim()).filter(Boolean);
    const lineup = (input.lineup ?? []).filter((item) => item.time.trim() && item.title.trim());
    const tiers =
      input.tiers && input.tiers.length > 0
        ? input.tiers
        : [
            {
              key: 'standard',
              name: 'Standard',
              price,
              inventoryTotal: 80,
              maxPerOrder: 4,
              waitlistEnabled: true,
              perks: ['Mobile ticket', 'Main access'],
            },
          ];

    await this.prisma.$transaction(async (tx) => {
      await tx.venue.create({
        data: {
          id: venueId,
          name: venueName,
          city,
          country,
          district: null,
          category,
          description,
          imageUrl: venueImage,
        },
      });

      await tx.event.create({
        data: {
          id: eventId,
          organizerId,
          venueId,
          title,
          date,
          location,
          category,
          price,
          description,
          organizer,
          color,
          imageUrl: eventImage,
          status,
          coverImageUrl,
          venueMapUrl: input.venueMapUrl?.trim() || null,
          publishedAt: status === 'published' ? new Date() : null,
        },
      });

      if (galleryImageUrls.length > 0) {
        await tx.eventGalleryImage.createMany({
          data: galleryImageUrls.map((url, index) => ({
            id: `gallery_${eventId}_${index + 1}_${randomUUID()}`,
            eventId,
            url,
            sortOrder: index,
          })),
        });
      }

      if (lineup.length > 0) {
        await tx.eventLineupItem.createMany({
          data: lineup.map((item, index) => ({
            id: `lineup_${eventId}_${index + 1}_${randomUUID()}`,
            eventId,
            time: item.time.trim(),
            title: item.title.trim(),
            stage: item.stage.trim() || 'Main Stage',
          })),
        });
      }

      await tx.eventTier.createMany({
        data: tiers.map((tier, index) => ({
          id: `tier_${eventId}_${index + 1}_${randomUUID()}`,
          eventId,
          key: tier.key.trim().toLowerCase(),
          name: tier.name.trim(),
          priceLabel: tier.price.trim(),
          priceCents: parsePrice(tier.price),
          inventoryTotal: Math.max(0, tier.inventoryTotal),
          inventorySold: 0,
          maxPerOrder: Math.max(1, tier.maxPerOrder),
          waitlistEnabled: Boolean(tier.waitlistEnabled),
          perks: JSON.stringify(tier.perks.filter(Boolean)),
        })),
      });

      if (input.promoCodes?.length) {
        await tx.promoCode.createMany({
          data: input.promoCodes.map((promo) => ({
            id: `promo_${eventId}_${randomUUID()}`,
            eventId,
            code: promo.code.trim().toUpperCase(),
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            maxUses: promo.maxUses,
            usedCount: 0,
            active: true,
            tierKey: promo.tierKey?.trim().toLowerCase() || null,
          })),
        });
      }
    });

    return (await this.getEvent(eventId))!;
  }

  async updateEvent(id: string, input: UpdateEventInput): Promise<Event | null> {
    const current = await this.prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
      },
    });
    if (!current) {
      return null;
    }

    const title = typeof input.title === 'string' ? input.title.trim() || current.title : current.title;
    const date = typeof input.date === 'string' ? input.date.trim() || current.date : current.date;
    const location = typeof input.location === 'string' ? input.location.trim() || current.location : current.location;
    const category = typeof input.category === 'string' ? input.category.trim() || current.category : current.category;
    const organizer = typeof input.organizer === 'string' ? input.organizer.trim() || current.organizer : current.organizer;
    const price = typeof input.price === 'string' ? input.price.trim() || current.price : current.price;
    const description = typeof input.description === 'string' ? input.description.trim() || current.description : current.description;
    const color = typeof input.color === 'string' ? input.color.trim() || current.color : current.color;
    const nextColor = color || defaultEventColor(category);
    const venueName = venueNameFromEventTitle(title);
    const { city, country } = parseLocationParts(location);
    const venueImage = buildVenueImage(`venue-${current.venueId}-${slugify(venueName)}`, venueName, location, category);
    const eventImage = buildEventImage(`event-${current.id}-${slugify(title)}`, title, location, category, nextColor);
    const status = input.status ?? (current.status as 'draft' | 'published');

    await this.prisma.$transaction(async (tx) => {
      await tx.venue.update({
        where: { id: current.venueId },
        data: {
          name: venueName,
          city,
          country,
          category,
          description,
          imageUrl: venueImage,
        },
      });

      await tx.event.update({
        where: { id },
        data: {
          title,
          date,
          location,
          category,
          organizer,
          price,
          description,
          color: nextColor,
          imageUrl: eventImage,
          status,
          coverImageUrl: typeof input.coverImageUrl === 'string' ? input.coverImageUrl.trim() || eventImage : current.coverImageUrl ?? eventImage,
          venueMapUrl:
            input.venueMapUrl === null
              ? null
              : typeof input.venueMapUrl === 'string'
                ? input.venueMapUrl.trim() || null
                : current.venueMapUrl,
          publishedAt: status === 'published' ? current.publishedAt ?? new Date() : null,
        },
      });

      if (input.galleryImageUrls) {
        await tx.eventGalleryImage.deleteMany({ where: { eventId: id } });
        const gallery = input.galleryImageUrls.map((url) => url.trim()).filter(Boolean);
        if (gallery.length > 0) {
          await tx.eventGalleryImage.createMany({
            data: gallery.map((url, index) => ({
              id: `gallery_${id}_${index + 1}_${randomUUID()}`,
              eventId: id,
              url,
              sortOrder: index,
            })),
          });
        }
      }

      if (input.lineup) {
        await tx.eventLineupItem.deleteMany({ where: { eventId: id } });
        const lineup = input.lineup.filter((item) => item.time.trim() && item.title.trim());
        if (lineup.length > 0) {
          await tx.eventLineupItem.createMany({
            data: lineup.map((item, index) => ({
              id: `lineup_${id}_${index + 1}_${randomUUID()}`,
              eventId: id,
              time: item.time.trim(),
              title: item.title.trim(),
              stage: item.stage.trim() || 'Main Stage',
            })),
          });
        }
      }

      if (input.tiers) {
        await tx.eventTier.deleteMany({ where: { eventId: id } });
        await tx.eventTier.createMany({
          data: input.tiers.map((tier, index) => ({
            id: `tier_${id}_${index + 1}_${randomUUID()}`,
            eventId: id,
            key: tier.key.trim().toLowerCase(),
            name: tier.name.trim(),
            priceLabel: tier.price.trim(),
            priceCents: parsePrice(tier.price),
            inventoryTotal: Math.max(0, tier.inventoryTotal),
            inventorySold: 0,
            maxPerOrder: Math.max(1, tier.maxPerOrder),
            waitlistEnabled: Boolean(tier.waitlistEnabled),
            perks: JSON.stringify(tier.perks.filter(Boolean)),
          })),
        });
      }

      if (input.promoCodes) {
        await tx.promoCode.deleteMany({ where: { eventId: id } });
        if (input.promoCodes.length > 0) {
          await tx.promoCode.createMany({
            data: input.promoCodes.map((promo) => ({
              id: `promo_${id}_${randomUUID()}`,
              eventId: id,
              code: promo.code.trim().toUpperCase(),
              discountType: promo.discountType,
              discountValue: promo.discountValue,
              maxUses: promo.maxUses,
              usedCount: 0,
              active: true,
              tierKey: promo.tierKey?.trim().toLowerCase() || null,
            })),
          });
        }
      }
    });

    return this.getEvent(id);
  }

  async listUsers(): Promise<User[]> {
    const users = await this.prisma.user.findMany({ orderBy: [{ id: 'asc' }] });
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      role: user.role as User['role'],
      avatarUrl: user.avatarUrl,
      totalSpend: user.totalSpend,
    }));
  }

  async findUserById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user
      ? {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name,
          role: user.role as User['role'],
          avatarUrl: user.avatarUrl,
          totalSpend: user.totalSpend,
        }
      : null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = normalizeEmail(email);
    const user = await this.prisma.user.findFirst({ where: { email: normalizedEmail } });
    return user
      ? {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name,
          role: user.role as User['role'],
          avatarUrl: user.avatarUrl,
          totalSpend: user.totalSpend,
        }
      : null;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        id: `user_${randomUUID()}`,
        email: normalizeEmail(input.email),
        passwordHash: input.passwordHash,
        name: input.name.trim(),
        role: input.role ?? 'attendee',
        avatarUrl: null,
        totalSpend: 0,
      },
    });

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      role: user.role as User['role'],
      avatarUrl: user.avatarUrl,
      totalSpend: user.totalSpend,
    };
  }

  async updateUserProfile(userId: string, input: UpdateUserProfileInput): Promise<PublicUser | null> {
    const current = await this.findUserById(userId);
    if (!current) {
      return null;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: typeof input.name === 'string' ? input.name.trim() || current.name : current.name,
        email: typeof input.email === 'string' ? normalizeEmail(input.email) : current.email,
      },
    });

    return publicUser({
      id: updated.id,
      email: updated.email,
      passwordHash: updated.passwordHash,
      name: updated.name,
      role: updated.role as User['role'],
      avatarUrl: updated.avatarUrl,
      totalSpend: updated.totalSpend,
    });
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<boolean> {
    const current = await this.findUserById(userId);
    if (!current) {
      return false;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });

    return true;
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
    });
  }

  async consumePasswordResetToken(tokenHash: string, passwordHash: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const resetToken = await tx.passwordResetToken.findFirst({
        where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      });
      if (!resetToken) return false;

      await tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
      await tx.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } });
      return true;
    });
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await this.prisma.user.deleteMany({ where: { id: userId } });
    return result.count === 1;
  }

  async createNotification(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: { url?: string };
  }) {
    await this.prisma.notification.create({
      data: {
        id: `notification_${randomUUID()}`,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        dataUrl: input.data?.url ?? null,
        dataJson: input.data ? JSON.stringify(input.data) : null,
      },
    });
  }

  async listNotifications(userId: string): Promise<AppNotificationRecord[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      readAt: notification.readAt ? notification.readAt.toISOString() : null,
      createdAt: notification.createdAt.toISOString(),
      data: {
        url: notification.dataUrl ?? undefined,
      },
    }));
  }

  async markNotificationRead(notificationId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });

    return result.count > 0;
  }

  async followOrganizer(userId: string, organizerId: string) {
    await this.prisma.followedOrganizer.upsert({
      where: {
        userId_organizerId: {
          userId,
          organizerId,
        },
      },
      update: {},
      create: {
        id: `follow_organizer_${randomUUID()}`,
        userId,
        organizerId,
      },
    });
  }

  async followCategory(userId: string, category: string) {
    await this.prisma.followedCategory.upsert({
      where: {
        userId_category: {
          userId,
          category,
        },
      },
      update: {},
      create: {
        id: `follow_category_${randomUUID()}`,
        userId,
        category,
      },
    });
  }

  async trackSearch(userId: string, query: string) {
    await this.prisma.searchHistory.create({
      data: {
        id: `search_${randomUUID()}`,
        userId,
        query,
      },
    });
  }

  async trackEventInteraction(eventId: string, kind: string, userId?: string, city?: string) {
    await this.prisma.eventInteraction.create({
      data: {
        id: `interaction_${randomUUID()}`,
        eventId,
        kind,
        userId: userId ?? null,
        city: city ?? null,
      },
    });
  }

  async getMerchantAccount(organizerId: string, paymentMethod: PaymentMethodKey): Promise<PublicMerchantAccount> {
    const account = await this.prisma.merchantAccount.findUnique({
      where: {
        organizerId_provider: {
          organizerId,
          provider: paymentMethod,
        },
      },
    });

    return account ? makePublicMerchantAccount(account) : makeDefaultMerchantAccount(organizerId, paymentMethod);
  }

  async updateMerchantAccount(
    organizerId: string,
    paymentMethod: PaymentMethodKey,
    input: UpdateMerchantAccountInput,
  ): Promise<PublicMerchantAccount> {
    const existing = await this.prisma.merchantAccount.findUnique({
      where: {
        organizerId_provider: {
          organizerId,
          provider: paymentMethod,
        },
      },
    });

    const next = await this.prisma.merchantAccount.upsert({
      where: {
        organizerId_provider: {
          organizerId,
          provider: paymentMethod,
        },
      },
      create: {
        id: randomUUID(),
        organizerId,
        provider: paymentMethod,
        businessName: input.businessName?.trim() ?? '',
        supportEmail: input.supportEmail?.trim() ?? '',
        country: input.country?.trim() ?? '',
        city: input.city?.trim() ?? '',
        phoneNumber: input.phoneNumber?.trim() ?? '',
        payoutDetails: input.payoutDetails?.trim() ?? '',
        status: 'needs_info',
      },
      update: {
        businessName: input.businessName?.trim() ?? existing?.businessName ?? '',
        supportEmail: input.supportEmail?.trim() ?? existing?.supportEmail ?? '',
        country: input.country?.trim() ?? existing?.country ?? '',
        city: input.city?.trim() ?? existing?.city ?? '',
        phoneNumber: input.phoneNumber?.trim() ?? existing?.phoneNumber ?? '',
        payoutDetails: input.payoutDetails?.trim() ?? existing?.payoutDetails ?? '',
        updatedAt: new Date(),
      },
    });

    const complete =
      next.businessName.trim() &&
      next.supportEmail.trim() &&
      next.country.trim() &&
      next.city.trim() &&
      next.phoneNumber.trim() &&
      next.payoutDetails.trim();

    if ((next.status === 'ready') !== Boolean(complete)) {
      const reconciled = await this.prisma.merchantAccount.update({
        where: { id: next.id },
        data: { status: complete ? 'ready' : 'needs_info' },
      });
      return makePublicMerchantAccount(reconciled);
    }

    return makePublicMerchantAccount(next);
  }

  async getProfileSummary(userId: string): Promise<ProfileSummary | null> {
    const user = await this.findUserById(userId);
    if (!user) {
      return null;
    }

    const userTickets = await this.listTicketsForUser(userId);
    const locationsVisited = new Set(userTickets.map((entry) => entry.event.location)).size;
    const spend = userTickets.reduce((sum, entry) => sum + parsePrice(entry.event.price), 0);

    return {
      user: publicUser(user),
      stats: {
        ticketsPurchased: userTickets.length,
        eventsFollowed: userTickets.length,
        citiesVisited: locationsVisited,
        totalSpend: spend,
      },
    };
  }

  async listTicketsForUser(userId: string): Promise<PublicTicket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { userId },
      include: {
        event: true,
      },
      orderBy: [{ id: 'asc' }],
    });

    const publicTickets = tickets
      .map((ticket) =>
        makePublicTicket({
          id: ticket.id,
          userId: ticket.userId,
          eventId: ticket.eventId,
          seat: ticket.seat,
          code: ticket.code,
          status: ticket.status,
          holderName: ticket.holderName,
          gate: ticket.gate,
          tierKey: ticket.tierKey,
          pricePaid: ticket.pricePaid,
          event: makePublicEvent(ticket.event),
        }),
    );
    return uniqueById(publicTickets);
  }

  async listSavedEventsForUser(userId: string): Promise<PublicSavedEvent[]> {
    const savedEvents = await this.prisma.$queryRaw<
      Array<{
        createdAt: string | Date;
        eventId: string;
        organizerId: string | null;
        title: string;
        date: string;
        location: string;
        category: string;
        price: string;
        description: string;
        organizer: string;
        color: string;
        imageUrl: string;
      }>
    >`
      SELECT
        se.createdAt,
        e.id AS eventId,
        e.organizerId,
        e.title,
        e.date,
        e.location,
        e.category,
        e.price,
        e.description,
        e.organizer,
        e.color,
        e.imageUrl
      FROM "SavedEvent" AS se
      INNER JOIN "Event" AS e ON e.id = se.eventId
      WHERE se.userId = ${userId}
      ORDER BY se.createdAt DESC, se.id ASC
    `;

    return savedEvents.map((entry) => ({
      event: makePublicEvent({
        id: entry.eventId,
        organizerId: entry.organizerId,
        title: entry.title,
        date: entry.date,
        location: entry.location,
        category: entry.category,
        price: entry.price,
        description: entry.description,
        organizer: entry.organizer,
        color: entry.color,
        imageUrl: entry.imageUrl,
      }),
      createdAt: new Date(entry.createdAt).toISOString(),
    }));
  }

  async saveEventForUser(userId: string, eventId: string): Promise<PublicSavedEvent | null> {
    const user = await this.findUserById(userId);
    const event = await this.getEvent(eventId);
    if (!user || !event) {
      return null;
    }

    await this.prisma.$executeRaw`
      INSERT INTO "SavedEvent" ("id", "userId", "eventId", "createdAt")
      VALUES (${`saved_${randomUUID()}`}, ${userId}, ${eventId}, CURRENT_TIMESTAMP)
      ON CONFLICT("userId", "eventId") DO NOTHING
    `;

    const savedEvents = await this.listSavedEventsForUser(userId);
    return savedEvents.find((entry) => entry.event.id === eventId) ?? null;
  }

  async unsaveEventForUser(userId: string, eventId: string): Promise<boolean> {
    const removed = await this.prisma.$executeRaw`
      DELETE FROM "SavedEvent"
      WHERE "userId" = ${userId} AND "eventId" = ${eventId}
    `;

    return removed > 0;
  }

  async listTicketsForOrganizer(organizerId: string): Promise<PublicTicket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        event: {
          organizerId,
        },
      },
      include: {
        event: {
          include: {
            tiers: { orderBy: { key: 'asc' } },
          },
        },
      },
      orderBy: [{ id: 'asc' }],
    });

    return uniqueById(
      tickets.map((ticket) =>
        makePublicTicket({
          id: ticket.id,
          userId: ticket.userId,
          eventId: ticket.eventId,
          seat: ticket.seat,
          code: ticket.code,
          status: ticket.status,
          holderName: ticket.holderName,
          gate: ticket.gate,
          tierKey: ticket.tierKey,
          pricePaid: ticket.pricePaid,
          event: makePublicEvent(ticket.event),
        }),
      ),
    );
  }

  async getOrganizerTicket(ticketId: string, organizerId: string): Promise<PublicTicket | null> {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        event: {
          organizerId,
        },
      },
      include: {
        event: {
          include: {
            tiers: { orderBy: { key: 'asc' } },
          },
        },
      },
    });

    if (!ticket) {
      return null;
    }

    return makePublicTicket({
      id: ticket.id,
      userId: ticket.userId,
      eventId: ticket.eventId,
      seat: ticket.seat,
      code: ticket.code,
      status: ticket.status,
      holderName: ticket.holderName,
      gate: ticket.gate,
      tierKey: ticket.tierKey,
      pricePaid: ticket.pricePaid,
      event: makePublicEvent(ticket.event),
    });
  }

  async updateOrganizerTicket(
    ticketId: string,
    organizerId: string,
    input: UpdateOrganizerTicketInput,
  ): Promise<PublicTicket | null> {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        event: {
          organizerId,
        },
      },
      include: {
        event: {
          include: {
            tiers: { orderBy: { key: 'asc' } },
          },
        },
      },
    });

    if (!ticket) {
      return null;
    }

    const nextStatus =
      input.status === 'valid' || input.status === 'used' || input.status === 'cancelled' ? input.status : ticket.status;
    const nextGate =
      input.gate === null ? null : typeof input.gate === 'string' ? input.gate.trim() || null : ticket.gate;

    const updated = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: nextStatus,
        gate: nextGate,
      },
      include: {
        event: {
          include: {
            tiers: { orderBy: { key: 'asc' } },
          },
        },
      },
    });

    const publicTicket = makePublicTicket({
      id: updated.id,
      userId: updated.userId,
      eventId: updated.eventId,
      seat: updated.seat,
      code: updated.code,
      status: updated.status,
      holderName: updated.holderName,
      gate: updated.gate,
      tierKey: updated.tierKey,
      pricePaid: updated.pricePaid,
      event: makePublicEvent(updated.event),
    });

    if (ticket.gate !== updated.gate && updated.gate) {
      await this.createNotification({
        userId: updated.userId,
        type: 'gate_changed',
        title: `${updated.event.title} gate updated`,
        body: `Your entry gate is now ${updated.gate}.`,
        data: { url: `/ticket/${updated.id}` },
      });
    }

    return publicTicket;
  }

  async scanOrganizerTicket(
    organizerId: string,
    rawCode: string,
    gate?: string,
    source: 'qr' | 'manual' = 'qr',
  ): Promise<OrganizerTicketScanResult> {
    const code = extractTicketCode(rawCode);
    if (!code) {
      return { outcome: 'not_found', ticket: null };
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        code,
        event: {
          organizerId,
        },
      },
      include: {
        event: {
          include: {
            tiers: { orderBy: { key: 'asc' } },
          },
        },
      },
    });

    if (!ticket) {
      return { outcome: 'not_found', ticket: null };
    }

    const scanner = await this.prisma.user.findUnique({ where: { id: organizerId } });
    if (!scanner) {
      return { outcome: 'not_found', ticket: null };
    }

    const publicTicket = makePublicTicket({
      id: ticket.id,
      userId: ticket.userId,
      eventId: ticket.eventId,
      seat: ticket.seat,
      code: ticket.code,
      status: ticket.status,
      holderName: ticket.holderName,
      gate: ticket.gate,
      tierKey: ticket.tierKey,
      pricePaid: ticket.pricePaid,
      event: makePublicEvent(ticket.event),
    });

    if (ticket.status === 'cancelled') {
      const scan = await this.prisma.ticketScan.create({
        data: {
          ticketId: ticket.id,
          scannerId: scanner.id,
          scannerName: scanner.name,
          scannerRole: scanner.role,
          gate: gate?.trim() || ticket.gate || 'Main Gate',
          source,
          outcome: 'cancelled',
        },
      });
      return { outcome: 'cancelled', ticket: publicTicket, scan: publicTicketScan(scan) };
    }

    if (ticket.status === 'used') {
      const scan =
        (await this.prisma.ticketScan.findFirst({
          where: { ticketId: ticket.id, outcome: 'checked_in' },
          orderBy: { scannedAt: 'asc' },
        })) ??
        (await this.prisma.ticketScan.create({
          data: {
            ticketId: ticket.id,
            scannerId: scanner.id,
            scannerName: scanner.name,
            scannerRole: scanner.role,
            gate: ticket.gate || gate?.trim() || 'Main Gate',
            source,
            outcome: 'already_used',
          },
        }));
      return { outcome: 'already_used', ticket: publicTicket, scan: publicTicketScan(scan) };
    }

    const updated = await this.updateOrganizerTicket(ticket.id, organizerId, {
      status: 'used',
      gate: gate?.trim() || ticket.gate || 'Main Gate',
    });

    const scan = await this.prisma.ticketScan.create({
      data: {
        ticketId: ticket.id,
        scannerId: scanner.id,
        scannerName: scanner.name,
        scannerRole: scanner.role,
        gate: gate?.trim() || ticket.gate || 'Main Gate',
        source,
        outcome: 'checked_in',
      },
    });

    return {
      outcome: 'checked_in',
      ticket: updated,
      scan: publicTicketScan(scan),
    };
  }

  async getOrganizerScanStats(organizerId: string): Promise<OrganizerScanStats> {
    const events = await this.listEventsForOrganizer(organizerId);
    const tickets = await this.listTicketsForOrganizer(organizerId);
    const validTickets = tickets.filter((ticket) => ticket.status === 'valid').length;
    const usedTickets = tickets.filter((ticket) => ticket.status === 'used').length;
    const totalTickets = tickets.length;
    const tierStatsMap = new Map<string, OrganizerScanTierStats>();

    for (const ticket of tickets) {
      const tierKey = ticket.tierKey ?? 'standard';
      const existing =
        tierStatsMap.get(tierKey) ??
        {
          tierKey,
          tierName:
            ticket.event.tiers?.find((tier) => tier.key === tierKey)?.name ??
            formatTierName(tierKey),
          totalTickets: 0,
          scannedTickets: 0,
          pendingTickets: 0,
          cancelledTickets: 0,
        };

      existing.totalTickets += 1;
      if (ticket.status === 'used') {
        existing.scannedTickets += 1;
      } else if (ticket.status === 'valid') {
        existing.pendingTickets += 1;
      } else if (ticket.status === 'cancelled') {
        existing.cancelledTickets += 1;
      }

      tierStatsMap.set(tierKey, existing);
    }

    return {
      pending: validTickets,
      queued: events.length,
      scans: totalTickets > 0 ? Math.round((usedTickets / totalTickets) * 100) : 0,
      totalTickets,
      validTickets,
      usedTickets,
      byTier: Array.from(tierStatsMap.values()).sort(
        (a, b) => b.totalTickets - a.totalTickets || a.tierKey.localeCompare(b.tierKey),
      ),
    };
  }

  async quoteReservation(userId: string, eventId: string, tierKey: string, quantity: number, promoCode?: string): Promise<ReservationQuote | null> {
    const event = await this.getEvent(eventId);
    if (!event) {
      return null;
    }

    const tier = event.tiers?.find((entry) => entry.key === tierKey);
    if (!tier) {
      return null;
    }

    const safeQuantity = Math.max(1, Math.min(quantity, tier.maxPerOrder));
    const subtotal = tier.priceCents * safeQuantity;
    let discount = 0;
    let promoApplied: string | null = null;

    if (promoCode?.trim()) {
      const promo = await this.prisma.promoCode.findFirst({
        where: {
          eventId,
          code: promoCode.trim().toUpperCase(),
          active: true,
        },
      });

      if (promo && (!promo.tierKey || promo.tierKey === tierKey) && promo.usedCount < promo.maxUses) {
        discount =
          promo.discountType === 'percent'
            ? Math.round(subtotal * (promo.discountValue / 100))
            : Math.min(subtotal, promo.discountValue);
        promoApplied = promo.code;
      }
    }

    const remaining = Math.max(tier.inventoryRemaining - safeQuantity, 0);
    const soldOut = tier.inventoryRemaining < safeQuantity;

    return {
      tierKey,
      quantity: safeQuantity,
      subtotal,
      discount,
      total: Math.max(subtotal - discount, 0),
      promoApplied,
      remainingAfterPurchase: remaining,
      status: soldOut ? (tier.waitlistEnabled ? 'waitlist_only' : 'sold_out') : 'available',
    };
  }

  async getOrganizerDashboardStats(organizerId: string): Promise<OrganizerDashboardStats> {
    const events = await this.listEventsForOrganizer(organizerId);
    const tickets = await this.listTicketsForOrganizer(organizerId);
    const sales = tickets.length;
    const usedTickets = tickets.filter((ticket) => ticket.status === 'used').length;
    const merchantAccounts = await this.prisma.merchantAccount.findMany({ where: { organizerId } });

    return {
      sales,
      events: events.length,
      cities: countCities(events),
      scanRate: sales > 0 ? Math.round((usedTickets / sales) * 100) : 0,
      payoutStatus: merchantAccounts.every((account) => account.status === 'ready') ? 'ready' : 'needs_attention',
    };
  }

  async getOrganizerDashboard(organizerId: string): Promise<OrganizerDashboardPayload> {
    const stats = await this.getOrganizerDashboardStats(organizerId);
    const events = await this.listEventsForOrganizer(organizerId);
    const tickets = await this.listTicketsForOrganizer(organizerId);
    const ticketRecords = await this.prisma.ticket.findMany({
      where: {
        event: {
          organizerId,
        },
      },
      select: {
        createdAt: true,
      },
    });
    const eventIds = events.map((event) => event.id);
    const interactions = await this.prisma.eventInteraction.findMany({
      where: { eventId: { in: eventIds } },
      orderBy: [{ createdAt: 'asc' }],
    });
    const waitlistEntries = await this.prisma.waitlistEntry.findMany({
      where: { eventId: { in: eventIds } },
    });
    const checkouts = await this.prisma.checkoutSession.findMany({
      where: { organizerId },
    });

    const timelineMap = new Map<string, number>();
    for (const ticket of ticketRecords) {
      const bucket = monthBucket(ticket.createdAt);
      timelineMap.set(bucket, (timelineMap.get(bucket) ?? 0) + 1);
    }

    const topCitiesMap = new Map<string, number>();
    for (const ticket of tickets) {
      const city = cityFromLocation(ticket.event.location);
      topCitiesMap.set(city, (topCitiesMap.get(city) ?? 0) + 1);
    }

    const eventPerformance = events.map((event) => {
      const eventTickets = tickets.filter((ticket) => ticket.event.id === event.id);
      const eventWaitlist = waitlistEntries.filter((entry) => entry.eventId === event.id);
      return {
        eventId: event.id,
        published: event.status === 'published',
        grossSales: eventTickets.reduce((sum, ticket) => sum + (ticket.pricePaid ?? parsePrice(ticket.event.price)), 0),
        ticketsSold: eventTickets.length,
        waitlistCount: eventWaitlist.length,
      };
    });

    const purchases = interactions.filter((entry) => entry.kind === 'purchase').length;
    const views = interactions.filter((entry) => entry.kind === 'view').length + purchases;
    const checkoutCount = checkouts.length;

    return {
      stats,
      timeline: Array.from(timelineMap.entries()).map(([label, sales]) => ({ label, sales })),
      topCities: Array.from(topCitiesMap.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([city, tickets]) => ({ city, tickets })),
      funnel: {
        views,
        checkouts: checkoutCount,
        purchases,
        dropOffRate: views > 0 ? Math.max(0, Math.round(((views - purchases) / views) * 100)) : 0,
      },
      eventPerformance,
    };
  }

  async getTicket(ticketId: string, userId: string): Promise<PublicTicket | null> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, userId },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      return null;
    }

    return makePublicTicket({
      id: ticket.id,
      userId: ticket.userId,
      eventId: ticket.eventId,
      seat: ticket.seat,
      code: ticket.code,
      status: ticket.status,
      holderName: ticket.holderName,
      gate: ticket.gate,
      tierKey: ticket.tierKey,
      pricePaid: ticket.pricePaid,
      event: makePublicEvent(ticket.event),
    });
  }

  async createCheckoutSession(
    userId: string,
    eventId: string,
    tier: string,
    paymentMethod: PaymentMethodKey,
    quantity = 1,
    promoCode?: string,
  ): Promise<PublicCheckoutSession | null> {
    const user = await this.findUserById(userId);
    const event = await this.getEvent(eventId);
    if (!user || !event) {
      return null;
    }

    const quote = await this.quoteReservation(userId, eventId, tier, quantity, promoCode);
    if (!quote) {
      return null;
    }

    const organizerId = event.organizerId ?? `organizer_event_${event.id}`;
    const merchantAccount =
      (await this.prisma.merchantAccount.findUnique({
        where: {
          organizerId_provider: {
            organizerId,
            provider: paymentMethod,
          },
        },
      })) ?? undefined;
    const amount = quote.total;
    const session = await this.prisma.checkoutSession.create({
      data: {
        id: `checkout_${randomUUID()}`,
        userId,
        eventId: event.id,
        organizerId,
        tier,
        paymentMethod,
        amount,
        quantity: quote.quantity,
      status: amount > 0 && paymentMethod !== 'mbiyopay_mobile_money' && (!merchantAccount || merchantAccount.status !== 'ready')
          ? 'requires_merchant_setup'
          : 'ready_for_payment',
      },
      include: {
        event: true,
      },
    });

    return makePublicCheckoutSession({
      id: session.id,
      userId: session.userId,
      eventId: session.eventId,
      organizerId: session.organizerId,
      tier: session.tier,
      paymentMethod: session.paymentMethod as PaymentMethodKey,
      amount: session.amount,
      quantity: session.quantity,
      status: session.status,
      createdAt: session.createdAt,
      event: makePublicEvent(session.event),
      merchantAccount,
    });
  }

  async getCheckoutSession(sessionId: string, userId: string): Promise<PublicCheckoutSession | null> {
    const session = await this.prisma.checkoutSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        event: true,
      },
    });

    if (!session) {
      return null;
    }

    const merchantAccount = await this.prisma.merchantAccount.findUnique({
      where: {
        organizerId_provider: {
          organizerId: session.organizerId,
          provider: session.paymentMethod as PaymentMethodKey,
        },
      },
    });

    return makePublicCheckoutSession({
      id: session.id,
      userId: session.userId,
      eventId: session.eventId,
      organizerId: session.organizerId,
      tier: session.tier,
      paymentMethod: session.paymentMethod as PaymentMethodKey,
      amount: session.amount,
      quantity: session.quantity,
      status: session.status,
      createdAt: session.createdAt,
      event: makePublicEvent(session.event),
      merchantAccount: merchantAccount ?? undefined,
    });
  }

  async createMobileMoneyTransaction(input: {
    checkoutSessionId: string;
    userId: string;
    providerTransactionId?: string | null;
    status?: string;
    network: string;
    phoneNumber: string;
    countryCode: string;
    currency: string;
    amount: number;
    providerFee?: number | string | null;
    chargedAmount?: number | string | null;
    providerStatus?: string | null;
    instructions?: string | null;
    authMode?: string | null;
    redirectUrl?: string | null;
    rawResponse?: string;
  }): Promise<PublicMobileMoneyTransaction> {
    const transaction = await this.prisma.mobileMoneyTransaction.create({
      data: {
        id: `mobile_money_${randomUUID()}`,
        checkoutSessionId: input.checkoutSessionId,
        userId: input.userId,
        providerTransactionId: input.providerTransactionId ?? null,
        status: input.status ?? 'pending',
        network: input.network,
        phoneNumber: input.phoneNumber,
        countryCode: input.countryCode,
        currency: input.currency,
        amount: input.amount,
        providerFee: optionalFiniteNumber(input.providerFee),
        chargedAmount: optionalFiniteNumber(input.chargedAmount),
        providerStatus: input.providerStatus ?? input.status ?? 'pending',
        instructions: input.instructions ?? null,
        authMode: input.authMode ?? null,
        redirectUrl: input.redirectUrl ?? null,
        rawResponse: input.rawResponse,
      },
    });
    return makePublicMobileMoneyTransaction(transaction);
  }

  async getMobileMoneyTransaction(id: string, userId: string): Promise<PublicMobileMoneyTransaction | null> {
    const transaction = await this.prisma.mobileMoneyTransaction.findFirst({ where: { id, userId } });
    return transaction ? makePublicMobileMoneyTransaction(transaction) : null;
  }

  async getLatestMobileMoneyTransactionForCheckout(checkoutSessionId: string, userId: string): Promise<PublicMobileMoneyTransaction | null> {
    const transaction = await this.prisma.mobileMoneyTransaction.findFirst({
      where: { checkoutSessionId, userId },
      orderBy: { createdAt: 'desc' },
    });
    return transaction ? makePublicMobileMoneyTransaction(transaction) : null;
  }

  async reconcileMobileMoneyTransactions(providerTransactions: MbiYoTransaction[]): Promise<{ matched: number; applied: number }> {
    const localTransactions = await this.prisma.mobileMoneyTransaction.findMany({ where: { status: 'pending' } });
    let matched = 0;
    let applied = 0;

    for (const localTransaction of localTransactions) {
      const providerTransaction = findProviderTransaction(
        providerTransactions,
        localTransaction.providerTransactionId,
        localTransaction.checkoutSessionId,
      );
      if (!providerTransaction) continue;
      matched += 1;
      const providerId = providerTransaction.transaction_id ?? providerTransaction.id;
      const didApply = await this.applyMobileMoneyWebhook({
        checkoutSessionId: localTransaction.checkoutSessionId,
        providerTransactionId: providerId,
        status: providerTransaction.status ?? 'pending',
        providerAmount: providerTransaction.amount,
        providerCurrency: providerTransaction.currency,
        rawResponse: JSON.stringify(providerTransaction),
      });
      await this.prisma.mobileMoneyTransaction.update({
        where: { id: localTransaction.id },
        data: { reconciliationCheckedAt: new Date() },
      });
      if (didApply) applied += 1;
    }

    return { matched, applied };
  }

  async applyMobileMoneyWebhook(input: {
    checkoutSessionId?: string;
    providerTransactionId?: string;
    status: string;
    providerAmount?: number | string | null;
    providerCurrency?: string | null;
    providerFee?: number | string | null;
    chargedAmount?: number | string | null;
    instructions?: string | null;
    authMode?: string | null;
    redirectUrl?: string | null;
    rawResponse: string;
  }): Promise<boolean> {
    const transaction = input.providerTransactionId
      ? await this.prisma.mobileMoneyTransaction.findUnique({ where: { providerTransactionId: input.providerTransactionId } })
      : input.checkoutSessionId
        ? await this.prisma.mobileMoneyTransaction.findFirst({ where: { checkoutSessionId: input.checkoutSessionId } })
        : null;
    if (!transaction) return false;

    const session = await this.prisma.checkoutSession.findUnique({ where: { id: transaction.checkoutSessionId } });
    if (!session) return false;
    if (input.checkoutSessionId && input.checkoutSessionId !== session.id) return false;
    if (input.providerAmount !== undefined && !providerAmountMatches(transaction.amount, input.providerAmount)) return false;
    if (input.providerCurrency && input.providerCurrency.trim().toUpperCase() !== transaction.currency.toUpperCase()) return false;

    const nextStatus = preservePaymentStatus(transaction.status as PaymentStatus, normalizeProviderStatus(input.status));
    if (
      nextStatus === 'successful' &&
      (input.checkoutSessionId !== session.id ||
        !input.providerTransactionId ||
        input.providerAmount === undefined ||
        input.providerAmount === null ||
        !input.providerCurrency)
    ) {
      return false;
    }
    if (transaction.status === 'successful' && nextStatus === 'successful' && transaction.reservationIssuedAt) return true;
    if (nextStatus === 'successful') {
      const claim = await this.prisma.mobileMoneyTransaction.updateMany({
        where: { id: transaction.id, reservationStartedAt: null },
        data: { reservationStartedAt: new Date(), providerStatus: input.status },
      });
      if (claim.count === 0) return true;
      const reservation = await this.reserveTickets(transaction.userId, session.eventId, session.tier, session.quantity);
      if (!reservation || reservation.status !== 'confirmed') {
        await this.prisma.mobileMoneyTransaction.update({ where: { id: transaction.id }, data: { reservationStartedAt: null } });
        return false;
      }
    }

    await this.prisma.mobileMoneyTransaction.update({
      where: { id: transaction.id },
      data: {
        status: nextStatus,
        providerStatus: input.status,
        providerFee: input.providerFee === undefined ? transaction.providerFee : optionalFiniteNumber(input.providerFee) ?? transaction.providerFee,
        chargedAmount:
          input.chargedAmount === undefined ? transaction.chargedAmount : optionalFiniteNumber(input.chargedAmount) ?? transaction.chargedAmount,
        instructions: input.instructions ?? transaction.instructions,
        authMode: input.authMode ?? transaction.authMode,
        redirectUrl: input.redirectUrl ?? transaction.redirectUrl,
        providerTransactionId: input.providerTransactionId ?? transaction.providerTransactionId,
        rawResponse: input.rawResponse,
        reservationIssuedAt: nextStatus === 'successful' ? new Date() : transaction.reservationIssuedAt,
        reconciliationCheckedAt: new Date(),
      },
    });
    return true;
  }

  async reserveTickets(
    userId: string,
    eventId: string,
    tier: string,
    quantity: number,
    promoCode?: string,
  ): Promise<ReservationResult | null> {
    const user = await this.findUserById(userId);
    const event = await this.getEvent(eventId);
    if (!user || !event) {
      return null;
    }

    const quote = await this.quoteReservation(userId, eventId, tier, quantity, promoCode);
    if (!quote) {
      return null;
    }

    if (quote.status !== 'available') {
      const waitlistEntry = await this.prisma.waitlistEntry.create({
        data: {
          id: `waitlist_${randomUUID()}`,
          eventId,
          userId,
          tierKey: tier,
          quantity: quote.quantity,
          status: 'active',
        },
      });

      await this.createNotification({
        userId,
        type: 'waitlist_joined',
        title: `Waitlist joined for ${event.title}`,
        body: `You are on the waitlist for ${quote.quantity} ${tier} ticket(s).`,
        data: { url: `/event/${event.id}` },
      });

      if (event.organizerId) {
        await this.createNotification({
          userId: event.organizerId,
          type: 'organizer_waitlist_joined',
          title: `Waitlist activity for ${event.title}`,
          body: `${user.name} joined the ${tier} waitlist.`,
          data: { url: `/(organizer)/events/${event.id}` },
        });
      }

      return {
        status: 'waitlisted',
        tickets: [],
        waitlistEntryId: waitlistEntry.id,
      };
    }

    const tierRecord = await this.prisma.eventTier.findFirst({
      where: { eventId, key: tier },
    });
    if (!tierRecord) {
      return null;
    }

    const nextTicketNumber = (await this.prisma.ticket.count()) + 1;
    const year = yearFromDate(event.date);
    const tickets = await this.prisma.$transaction(async (tx) => {
      await tx.eventTier.update({
        where: { eventId_key: { eventId, key: tier } },
        data: {
          inventorySold: {
            increment: quote.quantity,
          },
        },
      });

      const createdTickets: any[] = [];
      for (let index = 0; index < quote.quantity; index += 1) {
        const ticketNumber = nextTicketNumber + index;
        const ticket = await tx.ticket.create({
          data: {
            id: String(ticketNumber),
            userId,
            eventId: event.id,
            seat: formatSeat(event.id, tier, ticketNumber),
            code: formatTicketCode(event.id, ticketNumber, year),
            status: 'valid',
            holderName: user.name,
            gate: null,
            tierKey: tier,
            pricePaid: Math.round(quote.total / quote.quantity),
          },
          include: {
            event: {
              include: {
                galleryImages: { orderBy: { sortOrder: 'asc' } },
                lineupItems: { orderBy: { time: 'asc' } },
                tiers: { orderBy: { key: 'asc' } },
              },
            },
          },
        });
        createdTickets.push(ticket);
      }

      if (promoCode?.trim()) {
        await tx.promoCode.updateMany({
          where: {
            eventId,
            code: promoCode.trim().toUpperCase(),
          },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          totalSpend: user.totalSpend + quote.total,
        },
      });

      return createdTickets;
    });

    await this.trackEventInteraction(event.id, 'purchase', userId, cityFromLocation(event.location));

    await this.createNotification({
      userId,
      type: 'ticket_confirmation',
      title: `${quote.quantity} ticket(s) confirmed`,
      body: `${event.title} is confirmed in your wallet.`,
      data: { url: `/ticket/${tickets[0]!.id}` },
    });

    if (event.organizerId) {
      await this.createNotification({
        userId: event.organizerId,
        type: 'organizer_ticket_reserved',
        title: `New order for ${event.title}`,
        body: `${user.name} reserved ${quote.quantity} ${tier} ticket(s).`,
        data: { url: `/(organizer)/tickets` },
      });
    }

    return {
      status: 'confirmed',
      tickets: tickets.map((ticket) =>
        makePublicTicket({
          id: ticket.id,
          userId: ticket.userId,
          eventId: ticket.eventId,
          seat: ticket.seat,
          code: ticket.code,
          status: ticket.status,
          holderName: ticket.holderName,
          gate: ticket.gate,
          tierKey: ticket.tierKey,
          pricePaid: ticket.pricePaid,
          event: makePublicEvent(ticket.event),
        }),
      ),
      waitlistEntryId: null,
    };
  }

  async reserveTicket(userId: string, eventId: string, tier: string): Promise<PublicTicket | null> {
    const reservation = await this.reserveTickets(userId, eventId, tier, 1);
    return reservation?.tickets[0] ?? null;
  }

  async getHomeFeed(userId?: string, city?: string) {
    const events = (await this.listEvents()).filter((event) => event.status !== 'draft');
    const scopedEvents = city ? events.filter((event) => cityFromLocation(event.location) === city) : events;
    const interactions = await this.prisma.eventInteraction.findMany();
    const recentSearches = userId
      ? (
          await this.prisma.searchHistory.findMany({
            where: { userId },
            orderBy: [{ createdAt: 'desc' }],
            take: 5,
          })
        ).map((entry) => entry.query)
      : [];

    const followedOrganizerIds = userId
      ? (
          await this.prisma.followedOrganizer.findMany({
            where: { userId },
          })
        ).map((entry) => entry.organizerId)
      : [];
    const followedCategories = userId
      ? (
          await this.prisma.followedCategory.findMany({
            where: { userId },
          })
        ).map((entry) => entry.category.toLowerCase())
      : [];
    const userTickets = userId ? await this.listTicketsForUser(userId) : [];
    const likedCategories = new Set(userTickets.map((ticket) => ticket.event.category.toLowerCase()));

    const trendScores = new Map<string, number>();
    for (const interaction of interactions) {
      const weight = interaction.kind === 'purchase' ? 5 : interaction.kind === 'checkout' ? 3 : 1;
      trendScores.set(interaction.eventId, (trendScores.get(interaction.eventId) ?? 0) + weight);
    }

    const trendingEvents = scopedEvents
      .map((event) => ({
        ...event,
        trendScore: trendScores.get(event.id) ?? 0,
      }))
      .sort((a, b) => b.trendScore - a.trendScore || a.title.localeCompare(b.title))
      .slice(0, 6);

    const recommendedEvents = scopedEvents
      .filter(
        (event) =>
          followedCategories.includes(event.category.toLowerCase()) ||
          likedCategories.has(event.category.toLowerCase()) ||
          recentSearches.some((query) => normalizeProviderQuery(event.title).includes(normalizeProviderQuery(query))),
      )
      .map((event) => ({
        ...event,
        recommendationReason: followedCategories.includes(event.category.toLowerCase())
          ? 'Matches a followed category'
          : likedCategories.has(event.category.toLowerCase())
            ? 'Because you booked a similar event'
            : 'Related to your recent searches',
      }))
      .slice(0, 6);

    const becauseYouLiked = scopedEvents
      .filter((event) => likedCategories.has(event.category.toLowerCase()))
      .map((event) => ({
        ...event,
        recommendationReason: 'Because you liked similar live events',
      }))
      .slice(0, 6);

    const followedOrganizerEvents = scopedEvents.filter((event) => event.organizerId && followedOrganizerIds.includes(event.organizerId));

    return {
      featuredEvents: scopedEvents.slice(0, 3),
      upcomingEvents: scopedEvents.slice(3),
      categories: ['all', ...Array.from(new Set(scopedEvents.map((event) => event.category.toLowerCase())))],
      trendingEvents,
      recommendedEvents,
      becauseYouLiked,
      recentSearches,
      followedOrganizerEvents,
      nearbyEvents: scopedEvents.slice(0, 6),
    };
  }

  async getSearchEnhancements(userId?: string) {
    const recentSearches = userId
      ? (
          await this.prisma.searchHistory.findMany({
            where: { userId },
            orderBy: [{ createdAt: 'desc' }],
            take: 5,
          })
        ).map((entry) => entry.query)
      : [];
    const followedOrganizerIds = userId
      ? (
          await this.prisma.followedOrganizer.findMany({
            where: { userId },
          })
        ).map((entry) => entry.organizerId)
      : [];
    const followedOrganizerEvents = userId
      ? (await this.listEvents()).filter((event) => event.organizerId && followedOrganizerIds.includes(event.organizerId))
      : [];

    return {
      recentSearches,
      followedOrganizerEvents,
    };
  }

  async listProviderUsers(filters: { city?: string; commune?: string; query?: string } = {}): Promise<ProviderUser[]> {
    const providers = await this.prisma.providerUser.findMany({
      orderBy: [{ city: 'asc' }, { commune: 'asc' }, { name: 'asc' }],
    });

    return applyProviderFilters(
      providers.map((provider) => ({
        phone: provider.phone,
        name: provider.name,
        city: provider.city,
        commune: provider.commune,
        lat: provider.lat,
        lng: provider.lng,
      })),
      filters,
    );
  }

  async getProviderDirectory(filters: { city?: string; commune?: string; query?: string } = {}): Promise<ProviderDirectoryResponse> {
    const providers = await this.listProviderUsers(filters);
    const scoped = filters.city ? await this.listProviderUsers({ city: filters.city }) : providers;
    const facetSource = providers.length > 0 ? providers : scoped;

    return {
      providers,
      coverage: buildProviderCoverage(scoped),
      facets: buildProviderFacets(facetSource),
      stats: {
        total: providers.length,
        coveredCommunes: new Set(scoped.map((provider) => provider.commune)).size,
      },
    };
  }
}

export async function createDataStore(filePath = DEFAULT_DB_FILE) {
  await ensureDatabaseSchema(filePath);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: toDatabaseUrl(filePath),
      },
    },
  });
  await prisma.$connect();
  await seedDatabase(prisma, seedData);
  return new DataStore(prisma);
}

let activeStorePromise: Promise<DataStore> = createDataStore();

export async function installStoreForTesting(filePath: string) {
  const nextStore = await createDataStore(filePath);
  const previousStorePromise = activeStorePromise;
  activeStorePromise = Promise.resolve(nextStore);
  let restored = false;

  return {
    store: nextStore,
    async restore() {
      if (restored) {
        return;
      }

      restored = true;
      activeStorePromise = previousStorePromise;
      await nextStore.close();
    },
  };
}

export const store = new Proxy({} as DataStore, {
  get(_target, property, _receiver) {
    return async (...args: unknown[]) => {
      const storeInstance = await activeStorePromise;
      const value = (storeInstance as unknown as Record<string | symbol, unknown>)[property];
      if (typeof value !== 'function') {
        return value;
      }

      return (value as (...methodArgs: unknown[]) => unknown).apply(storeInstance, args);
    };
  },
}) as DataStore;
