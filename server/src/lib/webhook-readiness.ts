const CANONICAL_WEBHOOK_PATH = '/api/payments/mobile-money/webhook';

type PaymentEnvironment = Record<string, string | undefined>;

function isPublicHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (normalized === 'localhost' || normalized === '::1' || normalized.endsWith('.local')) return false;
  if (/^127\./.test(normalized) || /^10\./.test(normalized) || /^192\.168\./.test(normalized)) return false;
  const private172 = normalized.match(/^172\.(\d{1,3})\./);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return false;
  return normalized.includes('.') && !/^0\.0\.0\.0$/.test(normalized);
}

export function getWebhookReadiness(environment: PaymentEnvironment) {
  let callbackUrl: URL | null = null;
  try {
    callbackUrl = environment.MBIYOPAY_WEBHOOK_URL ? new URL(environment.MBIYOPAY_WEBHOOK_URL) : null;
  } catch {
    callbackUrl = null;
  }

  const checks = {
    apiKeyConfigured: Boolean(environment.MBIYOPAY_API_KEY?.trim()),
    webhookSecretConfigured: Boolean(environment.MBIYOPAY_WEBHOOK_SECRET?.trim()),
    https: callbackUrl?.protocol === 'https:',
    publicHost: callbackUrl ? isPublicHostname(callbackUrl.hostname) : false,
    canonicalPath: callbackUrl?.pathname === CANONICAL_WEBHOOK_PATH,
  };

  return {
    ok: Object.values(checks).every(Boolean),
    acceptsSignedPost: true as const,
    provider: 'MBIYOPAY' as const,
    path: CANONICAL_WEBHOOK_PATH,
    checks,
  };
}

export function isPaidCheckoutEnabled(environment: PaymentEnvironment): boolean {
  return environment.PAID_CHECKOUT_ENABLED?.trim().toLowerCase() === 'true';
}

export function validateProductionPaymentEnvironment(environment: PaymentEnvironment): void {
  if (environment.NODE_ENV !== 'production' || !isPaidCheckoutEnabled(environment)) return;
  const readiness = getWebhookReadiness(environment);
  if (!readiness.ok) {
    const failedChecks = Object.entries(readiness.checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => name)
      .join(', ');
    throw new Error(`Paid checkout cannot start: webhook readiness failed (${failedChecks}).`);
  }
}
