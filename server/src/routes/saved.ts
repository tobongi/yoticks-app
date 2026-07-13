import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { store } from '../lib/store';

export const savedRouter = Router();

savedRouter.use(requireAuth);

savedRouter.get('/', async (req: AuthRequest, res) => {
  const savedEvents = await store.listSavedEventsForUser(req.userId!);
  return res.json({ savedEvents });
});

savedRouter.post('/:eventId', async (req: AuthRequest, res) => {
  const savedEvent = await store.saveEventForUser(req.userId!, req.params.eventId);
  if (!savedEvent) {
    return res.status(404).json({ error: 'Événement introuvable' });
  }

  return res.status(201).json({ savedEvent });
});

savedRouter.delete('/:eventId', async (req: AuthRequest, res) => {
  const removed = await store.unsaveEventForUser(req.userId!, req.params.eventId);
  if (!removed) {
    return res.status(404).json({ error: 'Événement introuvable' });
  }

  return res.json({ ok: true });
});
