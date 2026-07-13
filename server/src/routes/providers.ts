import { Router } from 'express';
import type { ProviderUser } from '../data';
import { store } from '../lib/store';

export const providersRouter = Router();

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function sortCounts(entries: Map<string, number>) {
  return Array.from(entries.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

function buildFacets(items: ProviderUser[]) {
  const cities = new Map<string, number>();
  const communes = new Map<string, number>();

  for (const provider of items) {
    cities.set(provider.city, (cities.get(provider.city) ?? 0) + 1);
    communes.set(provider.commune, (communes.get(provider.commune) ?? 0) + 1);
  }

  return {
    cities: sortCounts(cities),
    communes: sortCounts(communes),
  };
}

function buildCoverage(items: ProviderUser[]) {
  const groups = new Map<string, ProviderUser[]>();

  for (const provider of items) {
    const current = groups.get(provider.commune) ?? [];
    current.push(provider);
    groups.set(provider.commune, current);
  }

  return Array.from(groups.entries())
    .map(([commune, providers]) => ({
      commune,
      providers: providers.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.providers.length - a.providers.length || a.commune.localeCompare(b.commune));
}

providersRouter.get('/', async (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city : undefined;
  const commune = typeof req.query.commune === 'string' ? req.query.commune : undefined;
  const query = typeof req.query.q === 'string' ? req.query.q : undefined;
  const directory = await store.getProviderDirectory({ city, commune, query });
  const providers = directory.providers;
  const scoped = city ? (await store.getProviderDirectory({ city })).providers : providers;

  res.json({
    providers,
    coverage: buildCoverage(city ? scoped : providers),
    facets: buildFacets(providers.length > 0 ? providers : scoped),
    stats: {
      total: providers.length,
      coveredCommunes: new Set((city ? scoped : providers).map((provider) => provider.commune)).size,
    },
  });
});
