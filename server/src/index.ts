import './env';
import { app } from './app';
import { validateProductionPaymentEnvironment } from './lib/webhook-readiness';

const PORT = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV === 'production' && !process.env.PASSWORD_RESET_WEBHOOK_URL) {
  throw new Error('PASSWORD_RESET_WEBHOOK_URL is required in production.');
}

validateProductionPaymentEnvironment(process.env);

function startServer(attempt = 0) {
  const server = app.listen(PORT, () => {
    console.log(`[YoTicks] API prête sur http://localhost:${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && attempt < 10) {
      console.log(`[YoTicks] Port ${PORT} occupé, nouvelle tentative dans 500 ms... (essai ${attempt + 1})`);
      server.close();
      setTimeout(() => startServer(attempt + 1), 500);
      return;
    }

    console.error('[YoTicks] Erreur fatale:', err.message);
    process.exit(1);
  });

  function shutdown(signal: string) {
    console.log(`[YoTicks] ${signal} — arrêt propre...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 3000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
