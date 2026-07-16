import assert from 'node:assert/strict';
import test from 'node:test';
import { finalizePayment, getTransactionStatus, listTransactions, resendWebhook } from './mbiyopay';

test('lists MBIYOPAY transactions with the server-only bearer key and pagination', async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.MBIYOPAY_API_KEY;
  process.env.MBIYOPAY_API_KEY = 'server-test-key';
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(JSON.stringify({ data: [], meta: { total: 0 } }), { status: 200 });
  };

  try {
    await listTransactions({ page: 2, limit: 10 });
    assert.equal(request?.url, 'https://dashboard.mbiyo.africa/api/v1/merchant/transactions?page=2&limit=10');
    assert.equal(request?.headers.get('Authorization'), 'Bearer server-test-key');
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.MBIYOPAY_API_KEY;
    else process.env.MBIYOPAY_API_KEY = previousKey;
  }
});

test('gets one MBIYOPAY transaction status by provider transaction id', async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.MBIYOPAY_API_KEY;
  process.env.MBIYOPAY_API_KEY = 'server-test-key';
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(JSON.stringify({ status: 'success', data: { transaction_id: 'txn_1', status: 'successful' } }), { status: 200 });
  };

  try {
    const result = await getTransactionStatus('txn_1');
    assert.equal(result.data?.status, 'successful');
    assert.equal(request?.url, 'https://dashboard.mbiyo.africa/api/v1/merchant/transactions/txn_1');
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.MBIYOPAY_API_KEY;
    else process.env.MBIYOPAY_API_KEY = previousKey;
  }
});

test('finalizes a PIN-required MBIYOPAY transaction without exposing the API key to the client', async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.MBIYOPAY_API_KEY;
  process.env.MBIYOPAY_API_KEY = 'server-test-key';
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(JSON.stringify({ status: 'success', data: null }), { status: 200 });
  };

  try {
    await finalizePayment('txn_1', '123456');
    assert.equal(request?.url, 'https://dashboard.mbiyo.africa/api/v1/merchant/transactions/txn_1/finalize');
    assert.equal(request?.headers.get('Authorization'), 'Bearer server-test-key');
    assert.deepEqual(await request?.json(), { otp: '123456' });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.MBIYOPAY_API_KEY;
    else process.env.MBIYOPAY_API_KEY = previousKey;
  }
});

test('resends a MBIYOPAY webhook through the documented recovery endpoint', async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.MBIYOPAY_API_KEY;
  process.env.MBIYOPAY_API_KEY = 'server-test-key';
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(JSON.stringify({ status: 'success', message: 'Webhook sent successfully' }), { status: 200 });
  };

  try {
    await resendWebhook('txn_1');
    assert.equal(request?.url, 'https://dashboard.mbiyo.africa/api/v1/merchant/transactions/txn_1/resend-webhook');
    assert.equal(request?.method, 'POST');
    assert.equal(request?.headers.get('Authorization'), 'Bearer server-test-key');
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.MBIYOPAY_API_KEY;
    else process.env.MBIYOPAY_API_KEY = previousKey;
  }
});
