import type { BackendEvent, BackendOrganizerDashboardStats, BackendOrganizerScanStats, BackendTicket } from './backend';

export function buildHomeDigest(events: BackendEvent[], featured: BackendEvent[], upcoming: BackendEvent[]) {
  const spotlight = featured[0] ?? upcoming[0] ?? events[0] ?? null;
  const freeCount = events.filter((event) => event.price.toLowerCase().includes('gratuit')).length;
  const cityCount = new Set(events.map((event) => event.location)).size;
  const categoryCounts = Array.from(
    events.reduce((acc, event) => {
      acc.set(event.category, (acc.get(event.category) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));

  return {
    spotlight,
    stats: [
      { label: 'Soir', value: String(featured.length) },
      { label: 'Villes', value: String(cityCount) },
      { label: 'Gratuit', value: String(freeCount) },
    ],
    categories: categoryCounts,
  };
}

export function buildTicketDigest(tickets: BackendTicket[]) {
  const active = tickets.filter((ticket) => ticket.status === 'valid');
  const archived = tickets.filter((ticket) => ticket.status !== 'valid');
  return {
    active,
    archived,
    stats: [
      { label: 'QR prets', value: String(active.length) },
      { label: 'Archives', value: String(archived.length) },
      { label: 'Villes', value: String(new Set(tickets.map((ticket) => ticket.event.location)).size) },
    ],
  };
}

export function buildOrganizerDigest(
  stats: BackendOrganizerDashboardStats,
  scanStats: BackendOrganizerScanStats | null,
  eventCount: number,
) {
  const liveEvents = stats.events || eventCount;
  const scanned = scanStats?.usedTickets ?? 0;
  const total = scanStats?.totalTickets ?? 0;
  return {
    stats: [
      { label: 'Sorties', value: String(liveEvents) },
      { label: 'Ventes', value: String(stats.sales) },
      { label: 'Scan', value: total > 0 ? `${scanned}/${total}` : `${stats.scanRate}%` },
    ],
  };
}
