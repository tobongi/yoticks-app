export type ProviderUser = {
  phone: string;
  name: string;
  city: string;
  commune: string;
  lat: number;
  lng: number;
};

export type ProviderLookupInput = {
  city?: string;
  commune?: string;
  query?: string;
};

export type CommuneCoverage = {
  commune: string;
  providers: ProviderUser[];
};

export const KINSHASA_COMMUNES = [
  'Bandalungwa',
  'Barumbu',
  'Bumbu',
  'Gombe',
  'Kalamu',
  'Kasa-Vubu',
  'Kimbanseke',
  'Kinshasa',
  'Kintambo',
  'Kisenso',
  'Lemba',
  'Limete',
  'Lingwala',
  'Makala',
  'Maluku',
  'Masina',
  'Matete',
  'Mont-Ngafula',
  'Ndjili',
  'Ngaba',
  'Ngaliema',
  'Ngiri-Ngiri',
  'Nsele',
  'Selembao',
] as const;

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export const PROVIDER_USERS: ProviderUser[] = [
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

export function listProviderUsers(input: ProviderLookupInput = {}) {
  const city = normalizeText(input.city ?? '');
  const commune = normalizeText(input.commune ?? '');
  const query = normalizeText(input.query ?? '');

  return PROVIDER_USERS.filter((provider) => {
    if (city && normalizeText(provider.city) !== city) {
      return false;
    }

    if (commune && normalizeText(provider.commune) !== commune) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = normalizeText([provider.name, provider.phone, provider.city, provider.commune].join(' '));
    return haystack.includes(query);
  }).sort((a, b) => a.city.localeCompare(b.city) || a.commune.localeCompare(b.commune) || a.name.localeCompare(b.name));
}

export function getCommuneCoverage(city: string) {
  return groupProvidersByCommune(listProviderUsers({ city }));
}

export function groupProvidersByCommune(providers: ProviderUser[]) {
  const groups = new Map<string, ProviderUser[]>();

  for (const provider of providers) {
    const current = groups.get(provider.commune) ?? [];
    current.push(provider);
    groups.set(provider.commune, current);
  }

  return Array.from(groups.entries())
    .map<CommuneCoverage>(([commune, communeProviders]) => ({
      commune,
      providers: communeProviders.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.providers.length - a.providers.length || a.commune.localeCompare(b.commune));
}
