import { Router } from 'express';
import { store } from '../lib/store';

export const venuesRouter = Router();

venuesRouter.get('/', async (_req, res) => {
  const venues = await store.listVenues();
  res.json({ venues });
});

venuesRouter.get('/:id', async (req, res) => {
  const venue = await store.getVenue(req.params.id);
  if (!venue) {
    return res.status(404).json({ error: 'Venue introuvable' });
  }

  return res.json({ venue });
});
