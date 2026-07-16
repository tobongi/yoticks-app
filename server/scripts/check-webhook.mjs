import 'dotenv/config';

const configuredUrl = process.argv[2] || process.env.MBIYOPAY_WEBHOOK_URL;

if (!configuredUrl) {
  console.error('[YoTicks] MBIYOPAY_WEBHOOK_URL is required.');
  process.exit(1);
}

let response;
try {
  response = await fetch(configuredUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
} catch (error) {
  console.error(`[YoTicks] Webhook readiness request failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const payload = await response.json().catch(() => null);
if (!response.ok || payload?.ok !== true || payload?.acceptsSignedPost !== true) {
  console.error(`[YoTicks] Webhook is not ready (HTTP ${response.status}).`);
  process.exit(1);
}

console.log(`[YoTicks] Webhook ready: ${new URL(configuredUrl).origin}${payload.path}`);
