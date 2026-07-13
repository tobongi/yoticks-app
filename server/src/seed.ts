import {
  checkoutSessions as legacyCheckoutSessions,
  events as legacyEvents,
  merchantAccounts as legacyMerchantAccounts,
  providerUsers as legacyProviderUsers,
  tickets as legacyTickets,
  users as legacyUsers,
  type CheckoutSession,
  type MerchantAccount,
  type ProviderUser,
  type Ticket,
  type User,
} from './data';
import { buildVenueImageUrl } from './lib/venue-image';

export type SeedVenue = {
  id: string;
  name: string;
  city: string;
  country: string;
  district: string | null;
  category: string;
  description: string;
  imageUrl: string;
};

export type SeedEvent = {
  id: string;
  organizerId: string | null;
  venueId: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: string;
  description: string;
  organizer: string;
  color: string;
  imageUrl: string;
  status: 'draft' | 'published';
  coverImageUrl: string;
  venueMapUrl: string | null;
  galleryImageUrls: string[];
  lineup: Array<{ time: string; title: string; stage: string }>;
};

export type SeedEventTier = {
  id: string;
  eventId: string;
  key: string;
  name: string;
  priceLabel: string;
  priceCents: number;
  inventoryTotal: number;
  inventorySold: number;
  maxPerOrder: number;
  waitlistEnabled: boolean;
  perks: string[];
};

export type SeedPromoCode = {
  id: string;
  eventId: string;
  code: string;
  discountType: 'percent' | 'amount';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  tierKey: string | null;
};

export type SeedNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  dataUrl: string | null;
  dataJson: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export type SeedSearchHistory = {
  id: string;
  userId: string;
  query: string;
  createdAt: Date;
};

export type SeedFollowedOrganizer = {
  id: string;
  userId: string;
  organizerId: string;
  createdAt: Date;
};

export type SeedFollowedCategory = {
  id: string;
  userId: string;
  category: string;
  createdAt: Date;
};

export type SeedEventInteraction = {
  id: string;
  eventId: string;
  userId: string | null;
  kind: string;
  city: string | null;
  createdAt: Date;
};

export type SeedWaitlistEntry = {
  id: string;
  eventId: string;
  userId: string;
  tierKey: string;
  quantity: number;
  status: string;
  createdAt: Date;
};

type CityVenuePlan = {
  city: string;
  country: string;
  venues: Array<{
    name: string;
    district?: string;
    category: string;
  }>;
};

type EventTemplate = {
  title: string;
  category: string;
  price: string;
  color: string;
  organizer: string;
  date: string;
  description: string;
};

const CITY_VENUE_PLANS: CityVenuePlan[] = [
  {
    city: 'Kinshasa',
    country: 'RDC',
    venues: [
      { name: 'Centre Culturel Boboto', district: 'Gombe', category: 'Concerts' },
      { name: 'Palais du Peuple', district: 'Lingwala', category: 'Conférences' },
      { name: 'Théâtre de Verdure', district: 'Ngaliema', category: 'Soirées' },
      { name: 'Stade des Martyrs', district: 'Lingwala', category: 'Sport' },
      { name: 'Institut Français de Kinshasa', district: 'Gombe', category: 'Festivals' },
    ],
  },
  {
    city: 'Abidjan',
    country: 'CI',
    venues: [
      { name: 'Palais de la Culture', district: 'Treichville', category: 'Conférences' },
      { name: 'Canal Olympia Treichville', district: 'Treichville', category: 'Concerts' },
      { name: 'Sofitel Auditorium', district: 'Cocody', category: 'Meetups' },
      { name: 'Parc des Expositions', district: 'Port-Bouët', category: 'Festivals' },
      { name: 'Agora de Koumassi', district: 'Koumassi', category: 'Sport' },
    ],
  },
  {
    city: 'Dakar',
    country: 'SN',
    venues: [
      { name: 'Grand Théâtre National', district: 'Plateau', category: 'Concerts' },
      { name: 'Dakar Arena', district: 'Diamniadio', category: 'Sport' },
      { name: 'Place du Souvenir Africain', district: 'Corniche Ouest', category: 'Festivals' },
      { name: 'Institut Français de Dakar', district: 'Plateau', category: 'Conférences' },
      { name: 'Canal Olympia Teranga', district: 'Mermoz', category: 'Soirées' },
    ],
  },
  {
    city: 'Douala',
    country: 'CM',
    venues: [
      { name: 'Canal Olympia Bessengue', district: 'Bessengue', category: 'Concerts' },
      { name: 'Doual\'Art', district: 'Bonanjo', category: 'Exhibitions' },
      { name: 'Akwa Hall', district: 'Akwa', category: 'Meetups' },
      { name: 'Espace Foyer', district: 'Bonapriso', category: 'Soirées' },
      { name: 'Salle Polyvalente Bali', district: 'Bali', category: 'Workshops' },
    ],
  },
  {
    city: 'Libreville',
    country: 'GA',
    venues: [
      { name: 'Palais des Sports', district: 'Owendo', category: 'Sport' },
      { name: 'Institut Français du Gabon', district: 'Centre-ville', category: 'Conférences' },
      { name: 'Centre Culturel Français', district: 'Mont-Bouët', category: 'Concerts' },
      { name: 'Cap Caravane', district: 'Glass', category: 'Soirées' },
      { name: 'Arena Ntoum', district: 'Ntoum', category: 'Festivals' },
    ],
  },
  {
    city: 'Brazzaville',
    country: 'CG',
    venues: [
      { name: 'Palais des Congrès', district: 'Centre-ville', category: 'Conférences' },
      { name: 'Institut Français du Congo', district: 'Bacongo', category: 'Concerts' },
      { name: 'Kinsoundi Hall', district: 'Kinsoundi', category: 'Meetups' },
      { name: 'Brazzaville Expo', district: 'Mfilou', category: 'Festivals' },
      { name: 'Poto-Poto Arena', district: 'Poto-Poto', category: 'Sport' },
    ],
  },
  {
    city: 'Nairobi',
    country: 'KE',
    venues: [
      { name: 'KICC Hall', district: 'CBD', category: 'Conférences' },
      { name: 'Alliance Française', district: 'Westlands', category: 'Concerts' },
      { name: 'Safari Dome', district: 'Karen', category: 'Festivals' },
      { name: 'Uhuru Gardens Stage', district: 'Langata', category: 'Soirées' },
      { name: 'Westlands Hub', district: 'Westlands', category: 'Workshops' },
    ],
  },
  {
    city: 'Kigali',
    country: 'RW',
    venues: [
      { name: 'Kigali Convention Centre', district: 'Nyarutarama', category: 'Conférences' },
      { name: 'BK Arena', district: 'Gasabo', category: 'Sport' },
      { name: 'Mundi Center', district: 'Kacyiru', category: 'Concerts' },
      { name: 'Inema Arts Center', district: 'Kiyovu', category: 'Exhibitions' },
      { name: 'Serena Hall Kigali', district: 'Nyarutarama', category: 'Meetups' },
    ],
  },
  {
    city: 'Yaoundé',
    country: 'CM',
    venues: [
      { name: 'Palais des Congrès', district: 'Centre', category: 'Conférences' },
      { name: 'Hilton Ballroom', district: 'Centre', category: 'Concerts' },
      { name: 'Bastos Stage', district: 'Bastos', category: 'Soirées' },
      { name: 'Mfoundi Arena', district: 'Mfoundi', category: 'Sport' },
      { name: 'Centre Culturel Camerounais', district: 'Melen', category: 'Festivals' },
    ],
  },
  {
    city: 'Luanda',
    country: 'AO',
    venues: [
      { name: 'Cine Atlântico', district: 'Ingombota', category: 'Concerts' },
      { name: 'Talatona Convention Centre', district: 'Talatona', category: 'Conférences' },
      { name: 'Fortaleza Stage', district: 'Sambizanga', category: 'Festivals' },
      { name: 'Belas Arena', district: 'Belas', category: 'Sport' },
      { name: 'Ilha Cultural', district: 'Ilha do Cabo', category: 'Soirées' },
    ],
  },
];

const SPECIAL_EVENT_SEEDS: EventTemplate[] = [
  {
    title: 'Kinshasa Jazz Festival',
    category: 'Concerts',
    price: '5 000 FC',
    color: '#F99F22',
    organizer: 'Kinshasa Culture',
    date: '15 Juin 2026',
    description: 'La plus grande célébration de jazz en Afrique centrale. 12 artistes internationaux, 3 scènes, food court africain.',
  },
  {
    title: 'Africa CEO Forum',
    category: 'Conférences',
    price: '25 000 FC',
    color: '#D71F27',
    organizer: 'Africa Business+',
    date: '22 Juin 2026',
    description: 'Le sommet des dirigeants africains. 500+ CEO, panels, networking, pitch startups. Thème 2026 : IA & Souveraineté.',
  },
  {
    title: 'Nuit Électro Dakar',
    category: 'Soirées',
    price: '3 000 FC',
    color: '#3C9449',
    organizer: 'Dakar Nights',
    date: '28 Juin 2026',
    description: 'La nuit la plus attendue de la saison. DJs internationaux, son Dolby Atmos, light show immersif.',
  },
  {
    title: 'Tournoi de Football Communautaire',
    category: 'Sport',
    price: 'Gratuit',
    color: '#F99F22',
    organizer: 'Kinshasa Sport+',
    date: '5 Juil 2026',
    description: 'Un tournoi local ouvert aux équipes de quartier avec ambiance familiale, animations et trophées.',
  },
  {
    title: 'Salon de la Mode Africaine',
    category: 'Festivals',
    price: '8 000 FC',
    color: '#D71F27',
    organizer: 'Atelier Mode CI',
    date: '12 Juil 2026',
    description: 'Défilés, marques émergentes et créateurs invités autour de la scène mode africaine contemporaine.',
  },
  {
    title: 'Concert Gospel Gratitude',
    category: 'Concerts',
    price: '2 500 FC',
    color: '#3C9449',
    organizer: 'Gratitude Live',
    date: '19 Juil 2026',
    description: 'Une soirée gospel chaleureuse avec chorales invitées et mise en scène live pensée pour la scène.',
  },
  {
    title: 'Forum Jeunesse & Innovation',
    category: 'Conférences',
    price: 'Gratuit',
    color: '#FFC516',
    organizer: 'Youth Impact',
    date: '26 Juil 2026',
    description: 'Rencontres, ateliers et démos autour de l’entrepreneuriat, de l’IA et des métiers de demain.',
  },
  {
    title: 'Congo Startup Summit',
    category: 'Conférences',
    price: '12 000 FC',
    color: '#3C9449',
    organizer: 'Ada Oko Ventures',
    date: '2 Août 2026',
    description: 'Une journée pour fondateurs, investisseurs et builders autour de la croissance, du produit et du financement.',
  },
  {
    title: 'Brazzaville Food Expo',
    category: 'Festivals',
    price: '4 500 FC',
    color: '#D71F27',
    organizer: 'Kamau Events',
    date: '9 Août 2026',
    description: 'Cuisine de rue, chefs invités et démonstrations culinaires dans une ambiance de marché gourmand.',
  },
  {
    title: 'Women in Tech Night',
    category: 'Meetups',
    price: 'Gratuit',
    color: '#F99F22',
    organizer: 'Ada Oko Ventures',
    date: '18 Août 2026',
    description: 'Un meetup du soir avec talks, networking et opportunités pour les femmes dans la tech et le produit.',
  },
];

const EVENT_TEMPLATES: EventTemplate[] = [
  { title: 'Sunset Sessions', category: 'Concerts', price: '4 000 FC', color: '#F99F22', organizer: 'YoTicks Live', date: '3 Sept 2026', description: 'Une programmation plus intime pour finir la journée avec du live, des percussions et des sets fluides.' },
  { title: 'Founders Breakfast', category: 'Meetups', price: '3 000 FC', color: '#D71F27', organizer: 'YoTicks Studio', date: '6 Sept 2026', description: 'Petit déjeuner, échanges rapides et quelques annonces utiles pour les équipes qui construisent.' },
  { title: 'City Pitch Forum', category: 'Conférences', price: '6 000 FC', color: '#3C9449', organizer: 'YoTicks Business', date: '9 Sept 2026', description: 'Une scène courte, des idées nettes et des retours utiles pour les fondateurs et investisseurs.' },
  { title: 'After Dark Club Night', category: 'Soirées', price: '5 500 FC', color: '#FFC516', organizer: 'YoTicks Nights', date: '12 Sept 2026', description: 'Une soirée tardive avec une vraie montée en intensité au fil de la nuit.' },
  { title: 'Street Cup', category: 'Sport', price: 'Gratuit', color: '#3C9449', organizer: 'YoTicks Sport', date: '15 Sept 2026', description: 'Des matchs courts, une ambiance quartier et un format facile à suivre en live.' },
  { title: 'Design Week Live', category: 'Festivals', price: '7 500 FC', color: '#D71F27', organizer: 'YoTicks Culture', date: '18 Sept 2026', description: 'Création, installations et scènes hybrides pour un public curieux et très mobile.' },
  { title: 'Morning Workshop Lab', category: 'Workshops', price: '2 500 FC', color: '#F99F22', organizer: 'YoTicks Academy', date: '21 Sept 2026', description: 'Un format plus pratique que théorique, pensé pour repartir avec des choses applicables le jour même.' },
  { title: 'Open Mic Stories', category: 'Concerts', price: '2 000 FC', color: '#3C9449', organizer: 'YoTicks Live', date: '24 Sept 2026', description: 'Une scène ouverte pour les voix locales, les petites découvertes et les formats plus bruts.' },
];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildVenueId(index: number) {
  return `venue_${String(index + 1).padStart(2, '0')}`;
}

function buildEventId(index: number) {
  return String(index + 1);
}

function cityLabel(city: string, country: string) {
  return `${city}, ${country}`;
}

function buildVenueDescription(city: string, name: string, category: string) {
  return `${name} is one of the live ${category.toLowerCase()} stops in ${city}.`;
}

function buildEventDescription(venue: SeedVenue, template: EventTemplate) {
  return `${template.description} Hosted at ${venue.name} in ${venue.city}.`;
}

function parseSeedPrice(price: string) {
  const value = Number(price.replace(/[^\d]/g, ''));
  return Number.isFinite(value) ? value : 0;
}

const venueBlueprints = CITY_VENUE_PLANS.flatMap((cityPlan) =>
  cityPlan.venues.map((venue) => ({
    city: cityPlan.city,
    country: cityPlan.country,
    ...venue,
  })),
);

export const venues: SeedVenue[] = venueBlueprints.map((venue, index) => ({
  id: buildVenueId(index),
  name: venue.name,
  city: venue.city,
  country: venue.country,
  district: venue.district ?? null,
  category: venue.category,
  description: buildVenueDescription(venue.city, venue.name, venue.category),
  imageUrl: buildVenueImageUrl({
    seed: `venue-${index + 1}-${slugify(venue.name)}`,
    city: venue.city,
    category: venue.category,
    title: venue.name,
  }),
}));

export const events: SeedEvent[] = [
  ...SPECIAL_EVENT_SEEDS.map<SeedEvent>((template, index) => {
    const venue = venues[index];
    const legacyEvent = legacyEvents[index];

    return {
      id: buildEventId(index),
      organizerId: legacyEvent.organizerId ?? null,
      venueId: venue.id,
      title: template.title,
      date: template.date,
      location: cityLabel(venue.city, venue.country),
      category: template.category,
      price: template.price,
      description: template.description,
      organizer: template.organizer,
      color: template.color,
      imageUrl: buildVenueImageUrl({
        seed: `event-${index + 1}-${slugify(template.title)}-${slugify(venue.name)}`,
        city: venue.city,
        category: template.category,
        title: template.title,
        accent: template.color,
      }),
      status: 'published',
      coverImageUrl: buildVenueImageUrl({
        seed: `event-cover-${index + 1}-${slugify(template.title)}`,
        city: venue.city,
        category: template.category,
        title: template.title,
        accent: template.color,
      }),
      venueMapUrl: buildVenueImageUrl({
        seed: `event-map-${index + 1}-${slugify(template.title)}`,
        city: venue.city,
        category: 'Map',
        title: `${template.title} Venue Map`,
        accent: '#4A6FB3',
      }),
      galleryImageUrls: [
        buildVenueImageUrl({
          seed: `event-gallery-a-${index + 1}-${slugify(template.title)}`,
          city: venue.city,
          category: template.category,
          title: `${template.title} Gallery A`,
          accent: template.color,
        }),
        buildVenueImageUrl({
          seed: `event-gallery-b-${index + 1}-${slugify(template.title)}`,
          city: venue.city,
          category: template.category,
          title: `${template.title} Gallery B`,
          accent: '#111111',
        }),
      ],
      lineup: [
        { time: '09:00', title: 'Doors open', stage: 'Main Stage' },
        { time: '11:00', title: 'Headline session', stage: 'Main Stage' },
      ],
    };
  }),
  ...venues.slice(SPECIAL_EVENT_SEEDS.length).map<SeedEvent>((venue, offset) => {
    const template = EVENT_TEMPLATES[offset % EVENT_TEMPLATES.length];
    const sequence = SPECIAL_EVENT_SEEDS.length + offset;
    return {
      id: buildEventId(sequence),
      organizerId: null,
      venueId: venue.id,
      title: `${template.title} at ${venue.name}`,
      date: template.date,
      location: cityLabel(venue.city, venue.country),
      category: template.category,
      price: template.price,
      description: buildEventDescription(venue, template),
      organizer: template.organizer,
      color: template.color,
      imageUrl: buildVenueImageUrl({
        seed: `event-${sequence + 1}-${slugify(template.title)}-${slugify(venue.name)}`,
        city: venue.city,
        category: template.category,
        title: `${template.title} at ${venue.name}`,
        accent: template.color,
      }),
      status: 'published',
      coverImageUrl: buildVenueImageUrl({
        seed: `event-cover-${sequence + 1}-${slugify(template.title)}-${slugify(venue.name)}`,
        city: venue.city,
        category: template.category,
        title: `${template.title} Cover`,
        accent: template.color,
      }),
      venueMapUrl: buildVenueImageUrl({
        seed: `event-map-${sequence + 1}-${slugify(template.title)}-${slugify(venue.name)}`,
        city: venue.city,
        category: 'Map',
        title: `${template.title} Venue Map`,
        accent: '#4A6FB3',
      }),
      galleryImageUrls: [
        buildVenueImageUrl({
          seed: `event-gallery-a-${sequence + 1}-${slugify(template.title)}-${slugify(venue.name)}`,
          city: venue.city,
          category: template.category,
          title: `${template.title} Gallery A`,
          accent: template.color,
        }),
        buildVenueImageUrl({
          seed: `event-gallery-b-${sequence + 1}-${slugify(template.title)}-${slugify(venue.name)}`,
          city: venue.city,
          category: template.category,
          title: `${template.title} Gallery B`,
          accent: '#111111',
        }),
      ],
      lineup: [
        { time: '10:00', title: 'Arrival and welcome', stage: 'Hall A' },
        { time: '13:00', title: 'Main moment', stage: 'Hall A' },
      ],
    };
  }),
];

export const eventTiers: SeedEventTier[] = events.flatMap((event) => {
  const basePrice = parseSeedPrice(event.price);
  const standardPrice = event.price;
  const vipPrice = basePrice === 0 ? '5 000 FC' : `${Math.round(basePrice * 2).toLocaleString('fr-FR')} FC`;

  return [
    {
      id: `tier_${event.id}_standard`,
      eventId: event.id,
      key: 'standard',
      name: 'Standard',
      priceLabel: standardPrice,
      priceCents: basePrice,
      inventoryTotal: 80,
      inventorySold: 0,
      maxPerOrder: 4,
      waitlistEnabled: true,
      perks: ['Mobile ticket', 'Main access'],
    },
    {
      id: `tier_${event.id}_vip`,
      eventId: event.id,
      key: 'vip',
      name: 'VIP',
      priceLabel: vipPrice,
      priceCents: basePrice === 0 ? 5000 : Math.round(basePrice * 2),
      inventoryTotal: 12,
      inventorySold: 0,
      maxPerOrder: 2,
      waitlistEnabled: false,
      perks: ['Priority line', 'Premium access'],
    },
  ];
});

export const promoCodes: SeedPromoCode[] = events
  .filter((event) => parseSeedPrice(event.price) > 0)
  .map((event) => ({
    id: `promo_${event.id}_welcome`,
    eventId: event.id,
    code: `${slugify(event.title).slice(0, 6).toUpperCase()}10`,
    discountType: 'percent',
    discountValue: 10,
    maxUses: 25,
    usedCount: 0,
    active: true,
    tierKey: 'standard',
  }));

export const users: User[] = legacyUsers;
export const tickets: Ticket[] = legacyTickets;
export const merchantAccounts: MerchantAccount[] = legacyMerchantAccounts;
export const checkoutSessions: CheckoutSession[] = legacyCheckoutSessions;
export const providerUsers: ProviderUser[] = legacyProviderUsers;
export const notifications: SeedNotification[] = [];
export const searchHistory: SeedSearchHistory[] = [];
export const followedOrganizers: SeedFollowedOrganizer[] = [];
export const followedCategories: SeedFollowedCategory[] = [];
export const eventInteractions: SeedEventInteraction[] = legacyTickets.map((ticket, index) => {
  const event = events.find((entry) => entry.id === ticket.eventId);
  return {
    id: `interaction_${index + 1}`,
    eventId: ticket.eventId,
    userId: ticket.userId,
    kind: ticket.status === 'used' ? 'purchase' : 'view',
    city: event?.location.split(',')[0]?.trim() ?? null,
    createdAt: new Date(`2026-06-${String((index % 9) + 1).padStart(2, '0')}T10:00:00.000Z`),
  };
});
export const waitlistEntries: SeedWaitlistEntry[] = [];

export type SeedData = {
  checkoutSessions: CheckoutSession[];
  events: SeedEvent[];
  eventInteractions: SeedEventInteraction[];
  eventTiers: SeedEventTier[];
  followedCategories: SeedFollowedCategory[];
  followedOrganizers: SeedFollowedOrganizer[];
  merchantAccounts: MerchantAccount[];
  notifications: SeedNotification[];
  providerUsers: ProviderUser[];
  promoCodes: SeedPromoCode[];
  searchHistory: SeedSearchHistory[];
  tickets: Ticket[];
  users: User[];
  venues: SeedVenue[];
  waitlistEntries: SeedWaitlistEntry[];
};

export const seedData: SeedData = {
  checkoutSessions,
  events,
  eventInteractions,
  eventTiers,
  followedCategories,
  followedOrganizers,
  merchantAccounts,
  notifications,
  providerUsers,
  promoCodes,
  searchHistory,
  tickets,
  users,
  venues,
  waitlistEntries,
};
