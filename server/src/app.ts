import 'express-async-errors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { corsMiddleware, globalLimiter, authLimiter } from './middleware/security';
import { authRouter } from './routes/auth';
import { eventsRouter } from './routes/events';
import { organizerRouter } from './routes/organizer';
import { handleMobileMoneyWebhook, handleMobileMoneyWebhookReadiness, paymentsRouter } from './routes/payments';
import { savedRouter } from './routes/saved';
import { providersRouter } from './routes/providers';
import { venuesRouter } from './routes/venues';
import { ticketsRouter } from './routes/tickets';
import { notificationsRouter } from './routes/notifications';
import { discoveryRouter } from './routes/discovery';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(corsMiddleware);
app.use('/api/payments/mobile-money/webhook', express.raw({ type: 'application/json' }));
app.use('/api/mbiyopay/notify', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', globalLimiter);
app.get('/api/payments/mobile-money/webhook', handleMobileMoneyWebhookReadiness);
app.get('/api/mbiyopay/notify', handleMobileMoneyWebhookReadiness);
app.post('/api/mbiyopay/notify', handleMobileMoneyWebhook);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'YoTicks backend' });
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/password-reset', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/organizer', organizerRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/saved', savedRouter);
app.use('/api/providers', providersRouter);
app.use('/api/venues', venuesRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/discovery', discoveryRouter);

app.use((_req, res) => res.status(404).json({ error: 'Route introuvable' }));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Error && err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  if (err && typeof err === 'object' && (err as { type?: string }).type === 'entity.too.large') {
    return res.status(413).json({ error: 'Requête trop volumineuse' });
  }
  console.error('[YoTicks API]', err);
  res.status(500).json({ error: 'Une erreur interne est survenue' });
});
