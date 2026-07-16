import crypto from 'node:crypto';
import { toProviderAmount } from './payment-state';

export type MobileMoneyPayinInput = {
  amount: number;
  currency: string;
  orderId: string;
  callbackUrl: string;
  network: string;
  phoneNumber: string;
  countryCode: string;
  omOtp?: string;
};

export type MbiYoPayinRequest = {
  amount: number;
  currency: string;
  payment_method: 'mobile_money';
  order_id: string;
  callback_url: string;
  metadata: {
    network: string;
    phone_number: string;
    country_code: string;
    om_otp?: string;
  };
};

export type MbiYoPayinResponse = {
  status?: string;
  message?: string;
  data?: {
    transaction_id?: string;
    amount?: number;
    fee?: number;
    charged_amount?: number;
    currency?: string;
    order_id?: string;
    payment_method?: 'mobile_money';
    status?: string;
    created_at?: string;
    instructions?: string | null;
    auth_mode?: 'confirm' | 'pin' | null;
    redirect_url?: string | null;
  };
};

export type MbiYoTransaction = {
  id: string;
  amount?: string | number;
  charge?: string | number;
  status?: string;
  mode?: string;
  type?: string;
  description?: string;
  created_at?: string;
  decline_reason?: string | null;
  currency?: string;
  order_id?: string;
  transaction_id?: string;
};

export type MbiYoTransactionsResponse = {
  data?: MbiYoTransaction[];
  links?: { next?: string | null };
  meta?: { current_page?: number; last_page?: number; total?: number };
};

export type MbiYoTransactionStatusResponse = {
  status?: string;
  message?: string;
  data?: MbiYoTransaction & {
    transaction_id?: string;
    fee?: number;
    charged_amount?: number;
    currency?: string;
    order_id?: string;
    status?: string;
    payment_method?: string;
    metadata?: Record<string, unknown>;
    instructions?: string | null;
    auth_mode?: 'confirm' | 'pin' | null;
    redirect_url?: string | null;
  };
};

export function buildPayinRequest(input: MobileMoneyPayinInput): MbiYoPayinRequest {
  return {
    amount: toProviderAmount(input.amount),
    currency: input.currency,
    payment_method: 'mobile_money',
    order_id: input.orderId,
    callback_url: input.callbackUrl,
    metadata: {
      network: input.network,
      phone_number: input.phoneNumber,
      country_code: input.countryCode,
      ...(input.omOtp ? { om_otp: input.omOtp } : {}),
    },
  };
}

export function verifyWebhookSignature(payload: string, signature: string | undefined, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const provided = signature.replace(/^sha256=/i, '');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(provided, 'utf8');
  return expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function initiatePayin(input: MobileMoneyPayinInput): Promise<MbiYoPayinResponse> {
  const apiKey = process.env.MBIYOPAY_API_KEY;
  if (!apiKey) {
    throw new Error('MBIYOPAY_API_KEY is not configured');
  }

  const baseUrl = (process.env.MBIYOPAY_API_BASE_URL ?? 'https://dashboard.mbiyo.africa').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/v1/merchant/payin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildPayinRequest(input)),
  });
  const payload = await response.json() as MbiYoPayinResponse;
  if (!response.ok || payload.status === 'error') {
    throw new Error(payload.message || `MBIYOPAY request failed (${response.status})`);
  }
  return payload;
}

export async function listTransactions(options: { page?: number | 'all'; limit?: number } = {}): Promise<MbiYoTransactionsResponse> {
  const apiKey = process.env.MBIYOPAY_API_KEY;
  if (!apiKey) throw new Error('MBIYOPAY_API_KEY is not configured');

  const baseUrl = (process.env.MBIYOPAY_API_BASE_URL ?? 'https://dashboard.mbiyo.africa').replace(/\/$/, '');
  const query = new URLSearchParams();
  if (options.page !== undefined) query.set('page', String(options.page));
  if (options.limit !== undefined) query.set('limit', String(options.limit));
  const response = await fetch(`${baseUrl}/api/v1/transactions${query.size ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const payload = await response.json() as MbiYoTransactionsResponse & { message?: string };
  if (!response.ok) throw new Error(payload.message || `MBIYOPAY transaction request failed (${response.status})`);
  return payload;
}

export async function getTransactionStatus(transactionIdOrOrderId: string): Promise<MbiYoTransactionStatusResponse> {
  const apiKey = process.env.MBIYOPAY_API_KEY;
  if (!apiKey) throw new Error('MBIYOPAY_API_KEY is not configured');
  const baseUrl = (process.env.MBIYOPAY_API_BASE_URL ?? 'https://dashboard.mbiyo.africa').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/v1/merchant/transactions/${encodeURIComponent(transactionIdOrOrderId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const payload = await response.json() as MbiYoTransactionStatusResponse;
  if (!response.ok || payload.status === 'error') throw new Error(payload.message || `MBIYOPAY status request failed (${response.status})`);
  return payload;
}

export async function finalizePayment(transactionId: string, otp: string): Promise<MbiYoTransactionStatusResponse> {
  if (!/^\d{4,6}$/.test(otp.trim())) throw new Error('MBIYOPAY OTP must contain 4 to 6 digits');
  const apiKey = process.env.MBIYOPAY_API_KEY;
  if (!apiKey) throw new Error('MBIYOPAY_API_KEY is not configured');
  const baseUrl = (process.env.MBIYOPAY_API_BASE_URL ?? 'https://dashboard.mbiyo.africa').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/v1/merchant/transactions/${encodeURIComponent(transactionId)}/finalize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp: otp.trim() }),
  });
  const payload = await response.json() as MbiYoTransactionStatusResponse;
  if (!response.ok || payload.status === 'error' || payload.status === 'failed') {
    throw new Error(payload.message || `MBIYOPAY finalize request failed (${response.status})`);
  }
  return payload;
}

export async function resendWebhook(transactionId: string): Promise<{ status?: string; message?: string; data?: Record<string, unknown> }> {
  const apiKey = process.env.MBIYOPAY_API_KEY;
  if (!apiKey) throw new Error('MBIYOPAY_API_KEY is not configured');
  const baseUrl = (process.env.MBIYOPAY_API_BASE_URL ?? 'https://dashboard.mbiyo.africa').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/v1/merchant/transactions/${encodeURIComponent(transactionId)}/resend-webhook`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  });
  const payload = await response.json() as { status?: string; message?: string; data?: Record<string, unknown> };
  if (!response.ok || payload.status === 'error' || payload.status === 'failed') {
    throw new Error(payload.message || `MBIYOPAY webhook resend failed (${response.status})`);
  }
  return payload;
}
