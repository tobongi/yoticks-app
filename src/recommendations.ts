import type { BackendEvent } from './backend';

const MONTH_INDEX: Record<string, number> = {
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

const STOP_WORDS = new Set([
  'de',
  'du',
  'des',
  'la',
  'le',
  'les',
  'et',
  'en',
  'pour',
  'sur',
  'dans',
  'au',
  'aux',
  'un',
  'une',
]);

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function parsePriceValue(price: string) {
  const value = Number(price.replace(/[^\d]/g, ''));
  return Number.isFinite(value) ? value : 0;
}

function parseEventDate(date: string) {
  const match = date.match(/^(\d{1,2})\s+([A-Za-zéûôîÉÛÔÎàâêëïüç]+)\s+(\d{4})$/);
  if (!match) return Number.POSITIVE_INFINITY;

  const day = Number(match[1]);
  const monthKey = normalizeText(match[2]);
  const month = MONTH_INDEX[monthKey] ?? MONTH_INDEX[monthKey.slice(0, 4)] ?? Number.POSITIVE_INFINITY;
  const year = Number(match[3]);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(year, month, day).getTime();
}

function getCityKey(location: string) {
  return normalizeText(location.split(',')[0] ?? location).trim();
}

function getKeywords(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/g)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export type RelatedEvent = BackendEvent & {
  reason: string;
  score: number;
};

export function buildRelatedEvents(current: BackendEvent, events: BackendEvent[]): RelatedEvent[] {
  const currentCategory = normalizeText(current.category);
  const currentCity = getCityKey(current.location);
  const currentOrganizer = normalizeText(current.organizer);
  const currentDate = parseEventDate(current.date);
  const currentPrice = parsePriceValue(current.price);
  const currentKeywords = getKeywords(`${current.title} ${current.description}`);

  return events
    .filter((event) => event.id !== current.id)
    .map<RelatedEvent>((event) => {
      const candidateCategory = normalizeText(event.category);
      const candidateCity = getCityKey(event.location);
      const candidateOrganizer = normalizeText(event.organizer);
      const candidateDate = parseEventDate(event.date);
      const candidatePrice = parsePriceValue(event.price);
      const candidateKeywords = getKeywords(`${event.title} ${event.description}`);

      const reasons: string[] = [];
      let score = 0;

      const sameCategory =
        candidateCategory === currentCategory ||
        candidateCategory.includes(currentCategory) ||
        currentCategory.includes(candidateCategory);
      const sameCity = candidateCity && candidateCity === currentCity;
      const sameOrganizer = candidateOrganizer === currentOrganizer;
      const priceGap = Math.abs(candidatePrice - currentPrice);
      const priceBandMatch =
        currentPrice === 0
          ? candidatePrice === 0
          : candidatePrice === 0
            ? false
            : priceGap <= currentPrice * 0.35;
      const dateGapDays =
        Number.isFinite(currentDate) && Number.isFinite(candidateDate)
          ? Math.abs(candidateDate - currentDate) / (1000 * 60 * 60 * 24)
          : Number.POSITIVE_INFINITY;
      const sharedKeywords = candidateKeywords.filter((word) => currentKeywords.includes(word)).length;

      if (sameCategory) {
        score += 6;
        reasons.push('Meme categorie');
      }

      if (sameCity) {
        score += 5;
        reasons.push('Meme ville');
      }

      if (sameOrganizer) {
        score += 4;
        reasons.push('Meme organisateur');
      }

      if (priceBandMatch) {
        score += 2;
        reasons.push('Budget proche');
      }

      if (dateGapDays <= 14) {
        score += 3;
        reasons.push('Date proche');
      } else if (dateGapDays <= 30) {
        score += 1.5;
        reasons.push('Date voisine');
      }

      if (sharedKeywords > 0) {
        score += Math.min(sharedKeywords, 2);
        reasons.push('Thematique proche');
      }

      if (!reasons.length) {
        reasons.push('Suggestion pertinente');
      }

      const reason = reasons.slice(0, 2).join(' · ');

      return {
        ...event,
        score,
        reason,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aDateGap = Number.isFinite(currentDate) ? Math.abs(parseEventDate(a.date) - currentDate) : Number.POSITIVE_INFINITY;
      const bDateGap = Number.isFinite(currentDate) ? Math.abs(parseEventDate(b.date) - currentDate) : Number.POSITIVE_INFINITY;
      return aDateGap - bDateGap;
    })
    .filter((event, index) => event.score >= 4 || index === 0)
    .slice(0, 3);
}
