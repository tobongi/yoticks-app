import type { BackendEvent } from './backend';

export type CityPulseEntry = {
  city: string;
  count: number;
  label: string;
  meta: string;
};

type CityPulseCopy = {
  label: string;
  meta: string;
};

const CATEGORY_COPY: Record<string, CityPulseCopy> = {
  Concerts: {
    label: 'Scène live',
    meta: 'Jazz, chorales et food court en fin de journée.',
  },
  Conférences: {
    label: 'Idées & réseau',
    meta: 'Panels, pitchs et rencontres utiles.',
  },
  Soirées: {
    label: 'Nuits en vue',
    meta: 'DJ sets, lumière et sorties qui restent tard.',
  },
  Sport: {
    label: 'Terrain du moment',
    meta: 'Tournois de quartier et ambiance tribune.',
  },
  Festivals: {
    label: 'Culture en marche',
    meta: 'Défilés, scènes et créateurs invités.',
  },
  Live: {
    label: 'Sortie du moment',
    meta: 'Une sélection courte pour lancer la soirée.',
  },
};

function getCategoryCopy(category: string): CityPulseCopy {
  return CATEGORY_COPY[category] ?? CATEGORY_COPY.Live;
}

export function buildCityPulse(events: BackendEvent[]): CityPulseEntry[] {
  const cities = [...new Set(events.map((event) => event.location))].slice(0, 4);

  return cities.map((city) => {
    const cityEvents = events.filter((event) => event.location === city);
    const focus = cityEvents[0]?.category ?? 'Live';

    return {
      city,
      count: cityEvents.length,
      ...getCategoryCopy(focus),
    };
  });
}
