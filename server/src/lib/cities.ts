import type { Event } from '../data';

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export function getCityKey(location: string) {
  return normalizeText((location.split(',')[0] ?? location).trim());
}

export function getCityLabel(location: string) {
  return (location.split(',')[0] ?? location).trim() || location.trim();
}

export function countCities(events: Event[]) {
  return new Set(events.map((event) => getCityKey(event.location))).size;
}

