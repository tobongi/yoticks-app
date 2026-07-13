export type Event = {
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
  galleryImageUrls?: string[];
  venueMapUrl?: string | null;
  lineup?: Array<{ time: string; title: string; stage: string }>;
  tiers?: EventTier[];
};

export type Ticket = {
  id: string;
  userId: string;
  eventId: string;
  seat: string;
  code: string;
  status: 'valid' | 'used' | 'cancelled';
  gate: string | null;
  tierKey?: string;
  pricePaid?: number;
};

export type EventTier = {
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

export type PaymentMethodKey = 'apple_pay' | 'google_pay' | 'paypal' | 'card';

export type MerchantAccountStatus = 'needs_info' | 'ready';

export type MerchantAccount = {
  organizerId: string;
  provider: PaymentMethodKey;
  businessName: string;
  supportEmail: string;
  country: string;
  city: string;
  phoneNumber: string;
  payoutDetails: string;
  status: MerchantAccountStatus;
  updatedAt: string;
};

export type CheckoutSessionStatus = 'requires_merchant_setup' | 'ready_for_payment';

export type CheckoutSession = {
  id: string;
  userId: string;
  eventId: string;
  organizerId: string;
  tier: string;
  paymentMethod: PaymentMethodKey;
  amount: number;
  status: CheckoutSessionStatus;
  createdAt: string;
};

export type User = {
  id: string;
  email: string | null;
  passwordHash: string | null;
  name: string;
  role: 'attendee' | 'organizer';
  avatarUrl: string | null;
  totalSpend: number;
};

export type ProviderUser = {
  phone: string;
  name: string;
  city: string;
  commune: string;
  lat: number;
  lng: number;
};

export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: { url?: string };
  readAt: string | null;
  createdAt: string;
};

export const events: Event[] = [
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
  },
  {
    id: '8',
    organizerId: 'organizer_ada',
    title: 'Congo Startup Summit',
    date: '2 Août 2026',
    location: 'Kinshasa, RDC',
    category: 'Conférences',
    price: '12 000 FC',
    description: 'Une journée pour fondateurs, investisseurs et builders autour de la croissance, du produit et du financement.',
    organizer: 'Ada Oko Ventures',
    color: '#3C9449',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '9',
    organizerId: 'organizer_kamau',
    title: 'Brazzaville Food Expo',
    date: '9 Août 2026',
    location: 'Brazzaville, CG',
    category: 'Festivals',
    price: '4 500 FC',
    description: 'Cuisine de rue, chefs invités et démonstrations culinaires dans une ambiance de marché gourmand.',
    organizer: 'Kamau Events',
    color: '#D71F27',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '10',
    organizerId: 'organizer_ada',
    title: 'Women in Tech Night',
    date: '18 Août 2026',
    location: 'Douala, CM',
    category: 'Meetups',
    price: 'Gratuit',
    description: 'Un meetup du soir avec talks, networking et opportunités pour les femmes dans la tech et le produit.',
    organizer: 'Ada Oko Ventures',
    color: '#F99F22',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
  },
];

export const users: User[] = [
  {
    id: 'user_amy',
    email: 'amy.nkosi@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Amy Nkosi',
    role: 'attendee',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'user_leo',
    email: 'leo.mukendi@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Leo Mukendi',
    role: 'attendee',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'user_sara',
    email: 'sara.bemba@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Sara Bemba',
    role: 'attendee',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'user_demo',
    email: 'jean.dupont@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Jean Dupont',
    role: 'attendee',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'organizer_demo',
    email: 'organizer@yoticks.dev',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Mika Ndala',
    role: 'organizer',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'organizer_ada',
    email: 'ada.oko@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Ada Oko',
    role: 'organizer',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'organizer_kamau',
    email: 'kamau.njoroge@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Kamau Njoroge',
    role: 'organizer',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'organizer_dakar',
    email: 'dakar.nights@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Dakar Nights',
    role: 'organizer',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'user_maya',
    email: 'maya.kabongo@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Maya Kabongo',
    role: 'attendee',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'user_noah',
    email: 'noah.mutombo@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Noah Mutombo',
    role: 'attendee',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'user_ines',
    email: 'ines.mukasa@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Ines Mukasa',
    role: 'attendee',
    avatarUrl: null,
    totalSpend: 0,
  },
  {
    id: 'user_ben',
    email: 'ben.tshibangu@example.com',
    passwordHash: '$2a$10$37cG0xVLrYsblS/uN5H06.ic.WkcbH.cJn4X8pIyWGBT/zKh39xqi',
    name: 'Ben Tshibangu',
    role: 'attendee',
    avatarUrl: null,
    totalSpend: 0,
  },
];

export const tickets: Ticket[] = [
  { id: '1', userId: 'user_amy', eventId: '1', seat: 'A-12', code: 'YT-2026-001', status: 'used', gate: 'North Gate' },
  { id: '2', userId: 'user_leo', eventId: '4', seat: 'VIP', code: 'YT-2026-002', status: 'used', gate: 'West Entry' },
  { id: '3', userId: 'user_sara', eventId: '6', seat: 'B-07', code: 'YT-2026-000', status: 'cancelled', gate: 'South Gate' },
  { id: '4', userId: 'user_demo', eventId: '1', seat: 'A-18', code: 'YT-2026-004', status: 'valid', gate: null },
  { id: '5', userId: 'user_maya', eventId: '8', seat: 'A-01', code: 'YT-2026-005', status: 'used', gate: 'Central Gate' },
  { id: '6', userId: 'user_noah', eventId: '9', seat: 'B-14', code: 'YT-2026-006', status: 'valid', gate: null },
  { id: '7', userId: 'user_ines', eventId: '10', seat: 'GA-22', code: 'YT-2026-007', status: 'valid', gate: null },
  { id: '8', userId: 'user_ben', eventId: '8', seat: 'VIP-02', code: 'YT-2026-008', status: 'cancelled', gate: 'Main Gate' },
];

export const merchantAccounts: MerchantAccount[] = [
  {
    organizerId: 'organizer_demo',
    provider: 'card',
    businessName: 'YoTicks Demo Live',
    supportEmail: 'organizer@yoticks.dev',
    country: 'RDC',
    city: 'Kinshasa',
    phoneNumber: '+243 900 000 000',
    payoutDetails: 'Rawbank ending 2214',
    status: 'ready',
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
  {
    organizerId: 'organizer_ada',
    provider: 'paypal',
    businessName: 'Ada Oko Ventures',
    supportEmail: 'ada.oko@example.com',
    country: 'RDC',
    city: 'Kinshasa',
    phoneNumber: '+243 955 112 233',
    payoutDetails: 'PayPal Business ada.oko@example.com',
    status: 'ready',
    updatedAt: '2026-06-04T10:30:00.000Z',
  },
  {
    organizerId: 'organizer_kamau',
    provider: 'google_pay',
    businessName: 'Kamau Events',
    supportEmail: 'kamau.njoroge@example.com',
    country: 'CG',
    city: 'Brazzaville',
    phoneNumber: '+242 066 555 010',
    payoutDetails: 'Ecobank settlement profile',
    status: 'ready',
    updatedAt: '2026-06-07T08:45:00.000Z',
  },
];

export const checkoutSessions: CheckoutSession[] = [];

export const providerUsers: ProviderUser[] = [
  { phone: '+243812345001', name: 'Marie Kabila', city: 'Kinshasa', commune: 'Gombe', lat: -4.3175, lng: 15.3222 },
  { phone: '+243812345002', name: 'Grace Mutombo', city: 'Kinshasa', commune: 'Bandalungwa', lat: -4.3378, lng: 15.2867 },
  { phone: '+243812345004', name: 'Esther Tshisekedi', city: 'Kinshasa', commune: 'Gombe', lat: -4.3094, lng: 15.3077 },
  { phone: '+243812345005', name: 'David Bokongo', city: 'Kinshasa', commune: 'Ngaliema', lat: -4.325, lng: 15.2561 },
  { phone: '+243812345006', name: 'Patrick Lumumba', city: 'Kinshasa', commune: 'Kalamu', lat: -4.3344, lng: 15.3137 },
  { phone: '+243812345007', name: 'Sarah Mavungu', city: 'Kinshasa', commune: 'Barumbu', lat: -4.3046, lng: 15.3318 },
  { phone: '+243812345008', name: 'Joel Kanku', city: 'Kinshasa', commune: 'Bumbu', lat: -4.3667, lng: 15.2844 },
  { phone: '+243812345009', name: 'Nadine Ilunga', city: 'Kinshasa', commune: 'Kasa-Vubu', lat: -4.3332, lng: 15.3018 },
  { phone: '+243812345010', name: 'Cedric Mbayo', city: 'Kinshasa', commune: 'Kimbanseke', lat: -4.3912, lng: 15.4038 },
  { phone: '+243812345011', name: 'Rachel Mbuyi', city: 'Kinshasa', commune: 'Kinshasa', lat: -4.3382, lng: 15.3174 },
  { phone: '+243812345012', name: 'Samuel Ekanga', city: 'Kinshasa', commune: 'Kintambo', lat: -4.3348, lng: 15.2765 },
  { phone: '+243812345013', name: 'Therese Kalonji', city: 'Kinshasa', commune: 'Kisenso', lat: -4.3914, lng: 15.3321 },
  { phone: '+243812345014', name: 'Bruno Kasongo', city: 'Kinshasa', commune: 'Lemba', lat: -4.4034, lng: 15.3115 },
  { phone: '+243812345015', name: 'Aimee Kitenge', city: 'Kinshasa', commune: 'Limete', lat: -4.3387, lng: 15.3432 },
  { phone: '+243812345016', name: 'Kevin Mvula', city: 'Kinshasa', commune: 'Lingwala', lat: -4.3111, lng: 15.2994 },
  { phone: '+243812345017', name: 'Agnes Bopeto', city: 'Kinshasa', commune: 'Makala', lat: -4.3836, lng: 15.2888 },
  { phone: '+243812345018', name: 'Fabrice Nzita', city: 'Kinshasa', commune: 'Maluku', lat: -4.3301, lng: 15.5108 },
  { phone: '+243812345019', name: 'Noella Lufungula', city: 'Kinshasa', commune: 'Masina', lat: -4.3841, lng: 15.3914 },
  { phone: '+243812345020', name: 'Herve Tamba', city: 'Kinshasa', commune: 'Matete', lat: -4.3852, lng: 15.3418 },
  { phone: '+243812345021', name: 'Clarisse Mbala', city: 'Kinshasa', commune: 'Mont-Ngafula', lat: -4.4468, lng: 15.2663 },
  { phone: '+243812345022', name: 'Nicolas Wanga', city: 'Kinshasa', commune: 'Ndjili', lat: -4.3857, lng: 15.3754 },
  { phone: '+243812345023', name: 'Dieudonne Moke', city: 'Kinshasa', commune: 'Ngaba', lat: -4.4011, lng: 15.3098 },
  { phone: '+243812345024', name: 'Judith Mankenda', city: 'Kinshasa', commune: 'Ngaliema', lat: -4.3473, lng: 15.2489 },
  { phone: '+243812345025', name: 'Blaise Sefu', city: 'Kinshasa', commune: 'Ngiri-Ngiri', lat: -4.3492, lng: 15.2896 },
  { phone: '+243812345026', name: 'Rosalie Mbenza', city: 'Kinshasa', commune: 'Nsele', lat: -4.3158, lng: 15.5147 },
  { phone: '+243812345027', name: 'Michael Nkodia', city: 'Kinshasa', commune: 'Selembao', lat: -4.3774, lng: 15.2657 },
  { phone: '+237651234001', name: 'Aissatou Njoya', city: 'Douala', commune: 'Douala I', lat: 4.0503, lng: 9.6942 },
  { phone: '+241071234001', name: 'Nadia Obame', city: 'Libreville', commune: '1er Arrondissement', lat: 0.3924, lng: 9.4536 },
];
