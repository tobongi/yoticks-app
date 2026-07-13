import { Router } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { store } from '../lib/store';

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth);

async function resolveTicket(ticketId: string, userId: string) {
  return store.getTicket(ticketId, userId);
}

ticketsRouter.get('/', async (req: AuthRequest, res) => {
  const userTickets = await store.listTicketsForUser(req.userId!);
  res.json({ tickets: userTickets });
});

ticketsRouter.post('/quote', async (req: AuthRequest, res) => {
  const { eventId, tierKey, quantity, promoCode } = req.body ?? {};

  if (typeof eventId !== 'string' || eventId.trim() === '') {
    return res.status(400).json({ error: 'Event requis' });
  }

  if (typeof tierKey !== 'string' || tierKey.trim() === '') {
    return res.status(400).json({ error: 'Billet requis' });
  }

  const quote = await store.quoteReservation(
    req.userId!,
    eventId.trim(),
    tierKey.trim().toLowerCase(),
    typeof quantity === 'number' ? quantity : 1,
    typeof promoCode === 'string' ? promoCode : undefined,
  );
  if (!quote) {
    return res.status(404).json({ error: 'Quote impossible' });
  }

  return res.json({ quote });
});

ticketsRouter.post('/reserve', async (req: AuthRequest, res) => {
  const { eventId, tier, tierKey, quantity, promoCode } = req.body ?? {};

  if (typeof eventId !== 'string' || eventId.trim() === '') {
    return res.status(400).json({ error: 'Event requis' });
  }

  const normalizedTier =
    typeof tierKey === 'string' && tierKey.trim()
      ? tierKey.trim().toLowerCase()
      : typeof tier === 'string' && tier.trim()
        ? tier.trim().toLowerCase()
        : 'standard';

  const reservation = await store.reserveTickets(
    req.userId!,
    eventId.trim(),
    normalizedTier,
    typeof quantity === 'number' ? quantity : 1,
    typeof promoCode === 'string' ? promoCode : undefined,
  );
  if (!reservation) {
    return res.status(500).json({ error: 'Reservation impossible' });
  }

  return res.status(201).json({ reservation, ticket: reservation.tickets[0] ?? null });
});

ticketsRouter.get('/:id', async (req: AuthRequest, res) => {
  const ticket = await resolveTicket(req.params.id, req.userId!);
  if (!ticket) {
    return res.status(404).json({ error: 'Billet introuvable' });
  }
  return res.json({ ticket });
});
