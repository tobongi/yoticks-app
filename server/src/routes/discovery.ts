import { Router } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { store } from '../lib/store';

export const discoveryRouter = Router();

discoveryRouter.use(requireAuth);

discoveryRouter.post('/follows/organizers', async (req: AuthRequest, res) => {
  const organizerId = typeof req.body?.organizerId === 'string' ? req.body.organizerId.trim() : '';
  if (!organizerId) {
    return res.status(400).json({ error: 'Organizer requis' });
  }

  await store.followOrganizer(req.userId!, organizerId);
  return res.json({ ok: true });
});

discoveryRouter.post('/follows/categories', async (req: AuthRequest, res) => {
  const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
  if (!category) {
    return res.status(400).json({ error: 'Categorie requise' });
  }

  await store.followCategory(req.userId!, category);
  return res.json({ ok: true });
});
