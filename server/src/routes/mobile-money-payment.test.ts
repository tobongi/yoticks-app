import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

const tempRoot = mkdtempSync(join(tmpdir(), 'yoticks-mobile-money-payment-'));
process.env.NODE_ENV = 'test';
process.env.YOTICKS_DB_FILE = join(tempRoot, 'payment.db');
process.env.JWT_SECRET = 'mobile-money-payment-test-secret';
process.env.MBIYOPAY_API_KEY = 'provider-test-key';
process.env.MBIYOPAY_WEBHOOK_SECRET = 'provider-webhook-test-secret';
process.env.MBIYOPAY_WEBHOOK_URL = 'https://api.yoticks.test/api/payments/mobile-money/webhook';

test('an immediately successful provider payment is verified and issues tickets exactly once', async () => {
  const { app } = await import('../app');
  const { store } = await import('../lib/store');
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}/api`;
  const originalFetch = globalThis.fetch;

  try {
    const register = await originalFetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Payment Test', email: 'payment-test@example.com', password: 'Password123!' }),
    });
    const { token } = await register.json() as { token: string };
    assert.equal(register.status, 200);

    const checkoutResponse = await originalFetch(`${baseUrl}/payments/checkout-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId: '1', tier: 'standard', paymentMethod: 'mbiyopay_mobile_money', quantity: 2 }),
    });
    const { session } = await checkoutResponse.json() as { session: { id: string; amount: number } };
    assert.equal(checkoutResponse.status, 201);

    const providerRequests: string[] = [];
    let providerData: {
      transaction_id: string;
      order_id: string;
      amount: number | string;
      currency: string;
      status: string;
      fee: number | string;
      charged_amount: number | string;
    } = {
      transaction_id: 'provider_immediate_success_1',
      order_id: session.id,
      amount: `${session.amount * 100}.00`,
      currency: 'CDF',
      status: 'successful',
      fee: '100.00',
      charged_amount: `${session.amount * 100 + 100}.00`,
    };
    globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      if (!request.url.startsWith('https://dashboard.mbiyo.africa/')) return originalFetch(input, init);
      providerRequests.push(`${request.method} ${request.url}`);
      return new Response(JSON.stringify({ status: 'success', data: providerData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const initiateResponse = await originalFetch(`${baseUrl}/payments/mobile-money/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        checkoutSessionId: session.id,
        network: 'airtel',
        phoneNumber: '+243970000000',
        countryCode: 'CD',
        currency: 'CDF',
      }),
    });
    const initiated = await initiateResponse.json() as {
      transaction: { id: string; status: string; reservationIssuedAt: string | null };
    };
    assert.equal(initiateResponse.status, 201);
    assert.equal(initiated.transaction.status, 'successful');
    assert.ok(initiated.transaction.reservationIssuedAt);
    assert.deepEqual(providerRequests, [
      'POST https://dashboard.mbiyo.africa/api/v1/merchant/payin',
      'GET https://dashboard.mbiyo.africa/api/v1/merchant/transactions/provider_immediate_success_1',
    ]);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const refresh = await originalFetch(`${baseUrl}/payments/mobile-money/${initiated.transaction.id}/refresh`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(refresh.status, 200);
    }

    const ticketsResponse = await originalFetch(`${baseUrl}/tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { tickets } = await ticketsResponse.json() as { tickets: unknown[] };
    assert.equal(ticketsResponse.status, 200);
    assert.equal(tickets.length, 2);

    const mismatchedCheckoutResponse = await originalFetch(`${baseUrl}/payments/checkout-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId: '2', tier: 'standard', paymentMethod: 'mbiyopay_mobile_money', quantity: 1 }),
    });
    const mismatchedCheckout = await mismatchedCheckoutResponse.json() as { session: { id: string; amount: number } };
    assert.equal(mismatchedCheckoutResponse.status, 201);
    providerData = {
      transaction_id: 'provider_wrong_amount_1',
      order_id: mismatchedCheckout.session.id,
      amount: mismatchedCheckout.session.amount * 100 + 1,
      currency: 'CDF',
      status: 'successful',
      fee: 100,
      charged_amount: mismatchedCheckout.session.amount * 100 + 101,
    };

    const mismatchedInitiate = await originalFetch(`${baseUrl}/payments/mobile-money/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        checkoutSessionId: mismatchedCheckout.session.id,
        network: 'airtel',
        phoneNumber: '+243970000000',
        countryCode: 'CD',
        currency: 'CDF',
      }),
    });
    const mismatched = await mismatchedInitiate.json() as {
      transaction: { status: string; reservationIssuedAt: string | null };
    };
    assert.equal(mismatchedInitiate.status, 201);
    assert.equal(mismatched.transaction.status, 'pending');
    assert.equal(mismatched.transaction.reservationIssuedAt, null);

    const ticketsAfterMismatch = await originalFetch(`${baseUrl}/tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mismatchTicketPayload = await ticketsAfterMismatch.json() as { tickets: unknown[] };
    assert.equal(mismatchTicketPayload.tickets.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await store.close();
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
