import type { BackendEvent } from './backend';

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export function getCityKey(location: string) {
  return normalizeText((location.split(',')[0] ?? location).trim());
}

export function getCityLabel(location: string) {
  return (location.split(',')[0] ?? location).trim() || location.trim();
}

export type CityGroup = {
  key: string;
  label: string;
  count: number;
  events: BackendEvent[];
};

export function groupEventsByCity(events: BackendEvent[]): CityGroup[] {
  const map = new Map<string, CityGroup>();

  for (const event of events) {
    const key = getCityKey(event.location);
    const label = getCityLabel(event.location);
    const existing = map.get(key);

    if (existing) {
      existing.count += 1;
      existing.events.push(event);
      if (label.length < existing.label.length) {
        existing.label = label;
      }
      continue;
    }

    map.set(key, {
      key,
      label,
      count: 1,
      events: [event],
    });
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
