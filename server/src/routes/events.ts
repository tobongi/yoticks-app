import { Router } from 'express';
import type { Event } from '../data';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { store } from '../lib/store';

export const eventsRouter = Router();
eventsRouter.use(optionalAuth);

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

function sortByDateAscending<T extends { date: string }>(items: T[]) {
  return [...items].sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function tokenizeQuery(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 1);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function scoreEvent(event: Event, query: string, queryWords: string[]) {
  if (!query) {
    return { score: 1, matchedFields: ['all'] as string[] };
  }

  const normalizedQuery = normalizeText(query);
  const fields = {
    title: normalizeText(event.title),
    location: normalizeText(event.location),
    category: normalizeText(event.category),
    organizer: normalizeText(event.organizer),
    description: normalizeText(event.description),
  };

  let score = 0;
  const matchedFields = new Set<string>();

  const fieldWeights = [
    ['title', 10],
    ['location', 8],
    ['category', 9],
    ['organizer', 6],
    ['description', 2],
  ] as const;

  for (const [field, weight] of fieldWeights) {
    if (fields[field].includes(normalizedQuery)) {
      score += weight;
      matchedFields.add(field);
    }
  }

  for (const word of queryWords) {
    for (const [field, weight] of fieldWeights) {
      if (fields[field].includes(word)) {
        score += weight * 0.65;
        matchedFields.add(field);
      }
    }
  }

  if (fields.title.startsWith(normalizedQuery)) score += 7;
  if (fields.category.startsWith(normalizedQuery)) score += 6;
  if (fields.location.startsWith(normalizedQuery)) score += 5;

  const queryStartsWithCategory = normalizeText(event.category).startsWith(normalizedQuery);
  if (queryStartsWithCategory) score += 5;

  return { score, matchedFields: Array.from(matchedFields) };
}

async function buildSuggestions(query: string) {
  const normalizedQuery = normalizeText(query);
  const candidateWeights = new Map<string, number>();
  const events = await store.listEvents();

  for (const event of events) {
    const candidates = [
      event.title,
      event.category,
      event.location,
      event.organizer,
      `${event.category} ${event.location}`,
      `${event.title} ${event.location}`,
    ];

    for (const candidate of candidates) {
      const normalizedCandidate = normalizeText(candidate);
      const isPrefix = normalizedCandidate.startsWith(normalizedQuery);
      const includesQuery = normalizedQuery ? normalizedCandidate.includes(normalizedQuery) : true;
      if (normalizedQuery && !isPrefix && !includesQuery) {
        continue;
      }

      const current = candidateWeights.get(candidate) ?? 0;
      candidateWeights.set(candidate, current + 1 + (isPrefix ? 2 : 0));
    }
  }

  const seeded = normalizedQuery
    ? Array.from(candidateWeights.entries())
    : Array.from(candidateWeights.entries()).slice(0, 12);

  return seeded
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value)
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 8);
}

function buildFacetCounts(items: Event[]) {
  const categories = new Map<string, number>();
  const cities = new Map<string, number>();

  for (const event of items) {
    categories.set(event.category, (categories.get(event.category) ?? 0) + 1);
    cities.set(event.location, (cities.get(event.location) ?? 0) + 1);
  }

  return {
    categories: Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count })),
    cities: Array.from(cities.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count })),
  };
}

eventsRouter.get('/', async (req, res) => {
  const events = await store.listEvents();
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const filtered = q
    ? events.filter((event) =>
        [event.title, event.location, event.category, event.organizer].join(' ').toLowerCase().includes(q),
      )
    : events;
  res.json({ events: sortByDateAscending(filtered) });
});

eventsRouter.get('/home', async (req: AuthRequest, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : undefined;
  const homeFeed = await store.getHomeFeed(req.userId, city);
  res.json(homeFeed);
});

eventsRouter.get('/search', async (req: AuthRequest, res) => {
  const events = await store.listEvents();
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const queryWords = tokenizeQuery(query);
  if (req.userId && query) {
    await store.trackSearch(req.userId, query);
  }
  const scored = events
    .map((event) => {
      const scoring = scoreEvent(event, query, queryWords);
      return {
        ...event,
        score: scoring.score,
        matchedFields: scoring.matchedFields,
      };
    })
    .filter((event) => (query ? event.score > 0 : true))
    .sort((a, b) => b.score - a.score || parseEventDate(a.date) - parseEventDate(b.date));

  const suggestions = await buildSuggestions(query);
  const facets = buildFacetCounts(scored.length ? scored : events);
  const enhancements = await store.getSearchEnhancements(req.userId);

  res.json({
    query,
    queryWords,
    normalizedQuery: normalizeText(query),
    suggestions,
    results: scored,
    facets,
    recentSearches: enhancements.recentSearches,
    followedOrganizerEvents: enhancements.followedOrganizerEvents,
  });
});

eventsRouter.get('/:id', async (req: AuthRequest, res) => {
  const event = await store.getEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event introuvable' });
  }
  await store.trackEventInteraction(event.id, 'view', req.userId, event.location.split(',')[0]?.trim());
  return res.json({ event });
});
