import { Router } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { store } from '../lib/store';

export const organizerRouter = Router();

organizerRouter.use(requireAuth);

type DraftStatus = 'draft' | 'published';
type LineupEntryInput = { time?: unknown; title?: unknown; stage?: unknown };
type TierInput = {
  key?: unknown;
  name?: unknown;
  price?: unknown;
  inventoryTotal?: unknown;
  maxPerOrder?: unknown;
  waitlistEnabled?: unknown;
  perks?: unknown[];
};
type PromoCodeInput = {
  code?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
  maxUses?: unknown;
  tierKey?: unknown;
};

function parseStatus(value: unknown): DraftStatus | undefined {
  return value === 'draft' || value === 'published' ? value : undefined;
}

function parseLineup(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter((entry: unknown): entry is LineupEntryInput => Boolean(entry) && typeof entry === 'object')
    .map((entry: LineupEntryInput) => ({
      time: typeof entry.time === 'string' ? entry.time : '',
      title: typeof entry.title === 'string' ? entry.title : '',
      stage: typeof entry.stage === 'string' ? entry.stage : '',
    }));
}

function parseTiers(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter((entry: unknown): entry is TierInput => Boolean(entry) && typeof entry === 'object')
    .map((entry: TierInput) => ({
      key: typeof entry.key === 'string' ? entry.key : '',
      name: typeof entry.name === 'string' ? entry.name : '',
      price: typeof entry.price === 'string' ? entry.price : '',
      inventoryTotal: typeof entry.inventoryTotal === 'number' ? entry.inventoryTotal : 0,
      maxPerOrder: typeof entry.maxPerOrder === 'number' ? entry.maxPerOrder : 1,
      waitlistEnabled: Boolean(entry.waitlistEnabled),
      perks: Array.isArray(entry.perks) ? entry.perks.filter((perk: unknown): perk is string => typeof perk === 'string') : [],
    }));
}

function parsePromoCodes(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter((entry: unknown): entry is PromoCodeInput => Boolean(entry) && typeof entry === 'object')
    .map((entry: PromoCodeInput) => ({
      code: typeof entry.code === 'string' ? entry.code : '',
      discountType: (entry.discountType === 'amount' ? 'amount' : 'percent') as 'amount' | 'percent',
      discountValue: typeof entry.discountValue === 'number' ? entry.discountValue : 0,
      maxUses: typeof entry.maxUses === 'number' ? entry.maxUses : 0,
      tierKey: typeof entry.tierKey === 'string' ? entry.tierKey : null,
    }));
}

organizerRouter.get('/events', async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  if (user.role !== 'organizer') {
    return res.status(403).json({ error: 'Accès réservé aux organisateurs' });
  }

  return res.json({ events: await store.listEventsForOrganizer(user.id) });
});

organizerRouter.post('/events', async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  if (user.role !== 'organizer') {
    return res.status(403).json({ error: 'Accès réservé aux organisateurs' });
  }

  const { title, date, location, category, price, description, organizer, color } = req.body ?? {};
  if (
    typeof title !== 'string' ||
    typeof date !== 'string' ||
    typeof location !== 'string' ||
    typeof category !== 'string' ||
    typeof price !== 'string' ||
    typeof description !== 'string' ||
    !title.trim() ||
    !date.trim() ||
    !location.trim() ||
    !category.trim() ||
    !price.trim() ||
    !description.trim()
  ) {
    return res.status(400).json({ error: 'Champs événement incomplets' });
  }

  const event = await store.createEvent(user.id, {
    title,
    date,
    location,
    category,
    price,
    description,
    organizer: typeof organizer === 'string' ? organizer : user.name,
    color: typeof color === 'string' ? color : undefined,
    status: parseStatus(req.body?.status),
    coverImageUrl: typeof req.body?.coverImageUrl === 'string' ? req.body.coverImageUrl : undefined,
    galleryImageUrls: Array.isArray(req.body?.galleryImageUrls)
      ? req.body.galleryImageUrls.filter((entry: unknown): entry is string => typeof entry === 'string')
      : undefined,
    venueMapUrl:
      req.body?.venueMapUrl === null ? null : typeof req.body?.venueMapUrl === 'string' ? req.body.venueMapUrl : undefined,
    lineup: parseLineup(req.body?.lineup),
    tiers: parseTiers(req.body?.tiers),
    promoCodes: parsePromoCodes(req.body?.promoCodes),
  });

  return res.status(201).json({ event });
});

organizerRouter.patch('/events/:id', async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  if (user.role !== 'organizer') {
    return res.status(403).json({ error: 'Accès réservé aux organisateurs' });
  }

  const event = await store.getEvent(req.params.id);
  if (!event || event.organizerId !== user.id) {
    return res.status(404).json({ error: 'Événement introuvable' });
  }

  const updated = await store.updateEvent(event.id, {
    title: typeof req.body?.title === 'string' ? req.body.title : undefined,
    date: typeof req.body?.date === 'string' ? req.body.date : undefined,
    location: typeof req.body?.location === 'string' ? req.body.location : undefined,
    category: typeof req.body?.category === 'string' ? req.body.category : undefined,
    organizer: typeof req.body?.organizer === 'string' ? req.body.organizer : undefined,
    price: typeof req.body?.price === 'string' ? req.body.price : undefined,
    description: typeof req.body?.description === 'string' ? req.body.description : undefined,
    color: typeof req.body?.color === 'string' ? req.body.color : undefined,
    status: parseStatus(req.body?.status),
    coverImageUrl: typeof req.body?.coverImageUrl === 'string' ? req.body.coverImageUrl : undefined,
    galleryImageUrls: Array.isArray(req.body?.galleryImageUrls)
      ? req.body.galleryImageUrls.filter((entry: unknown): entry is string => typeof entry === 'string')
      : undefined,
    venueMapUrl:
      req.body?.venueMapUrl === null ? null : typeof req.body?.venueMapUrl === 'string' ? req.body.venueMapUrl : undefined,
    lineup: parseLineup(req.body?.lineup),
    tiers: parseTiers(req.body?.tiers),
    promoCodes: parsePromoCodes(req.body?.promoCodes),
  });

  if (!updated) {
    return res.status(404).json({ error: 'Événement introuvable' });
  }

  return res.json({ event: updated });
});

organizerRouter.get('/tickets', async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  if (user.role !== 'organizer') {
    return res.status(403).json({ error: 'Accès réservé aux organisateurs' });
  }

  return res.json({ tickets: await store.listTicketsForOrganizer(user.id) });
});

organizerRouter.post('/tickets/scan', async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  if (user.role !== 'organizer') {
    return res.status(403).json({ error: 'Accès réservé aux organisateurs' });
  }

  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  const gate = typeof req.body?.gate === 'string' ? req.body.gate : undefined;
  const source = req.body?.source === 'manual' ? 'manual' : 'qr';
  const result = await store.scanOrganizerTicket(user.id, code, gate, source);

  if (result.outcome === 'not_found') {
    return res.status(404).json({ result });
  }

  if (result.outcome === 'cancelled') {
    return res.status(409).json({ result });
  }

  if (result.outcome === 'already_used') {
    return res.status(200).json({ result });
  }

  return res.status(200).json({ result });
});

organizerRouter.get('/tickets/:id', async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  if (user.role !== 'organizer') {
    return res.status(403).json({ error: 'Accès réservé aux organisateurs' });
  }

  const ticket = await store.getOrganizerTicket(req.params.id, user.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Billet introuvable' });
  }

  return res.json({ ticket });
});

organizerRouter.patch('/tickets/:id', async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  if (user.role !== 'organizer') {
    return res.status(403).json({ error: 'Accès réservé aux organisateurs' });
  }

  const status = req.body?.status;
  const gate = req.body?.gate;
  if (
    status !== undefined &&
    status !== 'valid' &&
    status !== 'used' &&
    status !== 'cancelled'
  ) {
    return res.status(400).json({ error: 'Statut de billet invalide' });
  }

  if (gate !== undefined && gate !== null && typeof gate !== 'string') {
    return res.status(400).json({ error: 'Porte invalide' });
  }

  const ticket = await store.updateOrganizerTicket(req.params.id, user.id, {
    status,
    gate,
  });

  if (!ticket) {
    return res.status(404).json({ error: 'Billet introuvable' });
  }

  return res.json({ ticket });
});

organizerRouter.get('/scan-stats', async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  if (user.role !== 'organizer') {
    return res.status(403).json({ error: 'Accès réservé aux organisateurs' });
  }

  return res.json({ stats: await store.getOrganizerScanStats(user.id) });
});

organizerRouter.get('/dashboard', async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  if (user.role !== 'organizer') {
    return res.status(403).json({ error: 'Accès réservé aux organisateurs' });
  }

  const dashboard = await store.getOrganizerDashboard(user.id);
  return res.json(dashboard);
});
