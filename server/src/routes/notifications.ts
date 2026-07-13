import { Router } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { store } from '../lib/store';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', async (req: AuthRequest, res) => {
  const notifications = await store.listNotifications(req.userId!);
  return res.json({ notifications });
});

notificationsRouter.patch('/:id/read', async (req: AuthRequest, res) => {
  const ok = await store.markNotificationRead(req.params.id, req.userId!);
  if (!ok) {
    return res.status(404).json({ error: 'Notification introuvable' });
  }

  return res.json({ ok: true });
});
