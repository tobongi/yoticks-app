import { Router, type Request, type Response } from 'express';
import { type PaymentMethodKey } from '../data';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { store } from '../lib/store';
import { finalizePayment, getTransactionStatus, initiatePayin, listTransactions, resendWebhook, verifyWebhookSignature } from '../lib/mbiyopay';
import { getMobileMoneyCountryOptions, validateMobileMoneyInput } from '../lib/payment-state';
import { getWebhookReadiness, isPaidCheckoutEnabled } from '../lib/webhook-readiness';

export const paymentsRouter = Router();

export function handleMobileMoneyWebhookReadiness(_req: Request, res: Response) {
  const readiness = getWebhookReadiness(process.env);
  return res.status(readiness.ok ? 200 : 503).json(readiness);
}

export async function handleMobileMoneyWebhook(req: Request, res: Response) {
  const rawPayload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body ?? {});
  const signature = req.header('Signature') ?? req.header('X-Signature');
  if (!verifyWebhookSignature(rawPayload, signature, process.env.MBIYOPAY_WEBHOOK_SECRET ?? '')) {
    return res.status(401).json({ error: 'Signature webhook invalide' });
  }

  let payload: {
    amount?: number;
    currency?: string;
    fee?: number;
    charged_amount?: number;
    transaction_id?: string;
    order_id?: string;
    status?: string;
    instructions?: string | null;
    auth_mode?: string | null;
    redirect_url?: string | null;
    metadata?: { om_otp?: string | null };
  };
  try {
    payload = JSON.parse(rawPayload) as typeof payload;
  } catch {
    return res.status(400).json({ error: 'Payload MBIYOPAY invalide' });
  }
  if (typeof payload.transaction_id !== 'string' || typeof payload.order_id !== 'string' || typeof payload.status !== 'string') {
    return res.status(400).json({ error: 'Payload MBIYOPAY incomplet' });
  }
  const verified = await getTransactionStatus(payload.transaction_id);
  const verifiedData = verified.data;
  if (!verifiedData || (verifiedData.order_id && verifiedData.order_id !== payload.order_id)) {
    return res.status(503).json({ error: 'Transaction MBIYOPAY non vérifiée' });
  }
  const applied = await store.applyMobileMoneyWebhook({
    checkoutSessionId: payload.order_id,
    providerTransactionId: payload.transaction_id,
    status: verifiedData.status ?? payload.status,
    providerAmount: verifiedData.amount ?? payload.amount,
    providerCurrency: verifiedData.currency ?? payload.currency,
    providerFee: verifiedData.fee ?? payload.fee,
    chargedAmount: verifiedData.charged_amount ?? payload.charged_amount,
    instructions: payload.instructions,
    authMode: payload.auth_mode,
    redirectUrl: payload.redirect_url,
    rawResponse: JSON.stringify(verified),
  });
  return res.status(applied ? 200 : 404).json({ received: true, applied });
}

paymentsRouter.post('/mobile-money/webhook', handleMobileMoneyWebhook);
paymentsRouter.post('/mbiyopay/notify', handleMobileMoneyWebhook);

paymentsRouter.use(requireAuth);

function isPaymentMethodKey(value: unknown): value is PaymentMethodKey {
  return value === 'apple_pay' || value === 'google_pay' || value === 'paypal' || value === 'card' || value === 'mbiyopay_mobile_money';
}

paymentsRouter.post('/checkout-sessions', async (req: AuthRequest, res) => {
  const { eventId, tier, paymentMethod, quantity, promoCode } = req.body ?? {};

  if (typeof eventId !== 'string' || eventId.trim() === '') {
    return res.status(400).json({ error: 'Event requis' });
  }

  if (typeof tier !== 'string' || tier.trim() === '') {
    return res.status(400).json({ error: 'Billet requis' });
  }

  if (!isPaymentMethodKey(paymentMethod)) {
    return res.status(400).json({ error: 'Moyen de paiement invalide' });
  }

  const session = await store.createCheckoutSession(
    req.userId!,
    eventId.trim(),
    tier.trim().toLowerCase(),
    paymentMethod,
    typeof quantity === 'number' ? quantity : 1,
    typeof promoCode === 'string' ? promoCode : undefined,
  );
  if (!session) {
    return res.status(404).json({ error: 'Checkout impossible' });
  }

  return res.status(201).json({ session });
});

paymentsRouter.get('/checkout-sessions/:id', async (req: AuthRequest, res) => {
  const session = await store.getCheckoutSession(req.params.id, req.userId!);
  if (!session) {
    return res.status(404).json({ error: 'Session introuvable' });
  }

  return res.json({ session });
});

paymentsRouter.post('/mobile-money/initiate', async (req: AuthRequest, res) => {
  if (process.env.NODE_ENV === 'production' && !isPaidCheckoutEnabled(process.env)) {
    return res.status(503).json({ error: 'Le paiement mobile money est temporairement indisponible' });
  }
  const { checkoutSessionId, network, phoneNumber, countryCode, currency, omOtp } = req.body ?? {};
  if (![checkoutSessionId, network, phoneNumber, countryCode, currency].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Informations mobile money incomplètes' });
  }

  const session = await store.getCheckoutSession(checkoutSessionId, req.userId!);
  if (!session || session.paymentMethod !== 'mbiyopay_mobile_money' || session.amount <= 0) {
    return res.status(404).json({ error: 'Session mobile money introuvable' });
  }

  const normalizedInput = {
    amount: session.amount,
    currency: currency.trim().toUpperCase(),
    network: network.trim().toLowerCase(),
    phoneNumber: phoneNumber.trim(),
    countryCode: countryCode.trim().toUpperCase(),
    omOtp: typeof omOtp === 'string' ? omOtp.trim() : undefined,
  };
  const inputValidation = validateMobileMoneyInput(normalizedInput);
  if (!inputValidation.valid) return res.status(422).json({ error: inputValidation.reason });

  const callbackUrl = process.env.MBIYOPAY_WEBHOOK_URL;
  if (!callbackUrl) return res.status(503).json({ error: 'Webhook MBIYOPAY non configuré' });

  const providerResponse = await initiatePayin({
    amount: session.amount,
    currency: normalizedInput.currency,
    orderId: session.id,
    callbackUrl,
    network: normalizedInput.network,
    phoneNumber: normalizedInput.phoneNumber,
    countryCode: normalizedInput.countryCode,
    omOtp: normalizedInput.omOtp,
  });
  const providerData = providerResponse.data ?? {};
  const transaction = await store.createMobileMoneyTransaction({
    checkoutSessionId: session.id,
    userId: req.userId!,
    providerTransactionId: providerData.transaction_id,
    status: providerData.status ?? 'pending',
    network: normalizedInput.network,
    phoneNumber: normalizedInput.phoneNumber,
    countryCode: normalizedInput.countryCode,
    currency: normalizedInput.currency,
    amount: session.amount,
    providerFee: providerData.fee,
    chargedAmount: providerData.charged_amount,
    providerStatus: providerData.status ?? 'pending',
    instructions: providerData.instructions,
    authMode: providerData.auth_mode,
    redirectUrl: providerData.redirect_url,
    rawResponse: JSON.stringify(providerResponse),
  });
  return res.status(201).json({ transaction });
});

paymentsRouter.get('/mobile-money/options', (_req, res) => {
  return res.json({ countries: getMobileMoneyCountryOptions() });
});

paymentsRouter.get('/mobile-money/checkout/:checkoutSessionId', async (req: AuthRequest, res) => {
  const session = await store.getCheckoutSession(req.params.checkoutSessionId, req.userId!);
  if (!session) return res.status(404).json({ error: 'Session introuvable' });
  const transaction = await store.getLatestMobileMoneyTransactionForCheckout(session.id, req.userId!);
  return res.json({ transaction });
});

paymentsRouter.get('/mobile-money/:id', async (req: AuthRequest, res) => {
  const transaction = await store.getMobileMoneyTransaction(req.params.id, req.userId!);
  if (!transaction) return res.status(404).json({ error: 'Transaction introuvable' });
  return res.json({ transaction });
});

paymentsRouter.get('/mobile-money/:id/refresh', async (req: AuthRequest, res) => {
  const transaction = await store.getMobileMoneyTransaction(req.params.id, req.userId!);
  if (!transaction) return res.status(404).json({ error: 'Transaction introuvable' });
  if (transaction.status !== 'pending' || !transaction.providerTransactionId) return res.json({ transaction });

  const provider = await getTransactionStatus(transaction.providerTransactionId);
  const providerData = provider.data;
  await store.applyMobileMoneyWebhook({
    checkoutSessionId: transaction.checkoutSessionId,
    providerTransactionId: providerData?.transaction_id ?? transaction.providerTransactionId,
    status: providerData?.status ?? 'pending',
    providerAmount: providerData?.amount,
    providerCurrency: providerData?.currency,
    providerFee: providerData?.fee,
    chargedAmount: providerData?.charged_amount,
    instructions: providerData?.instructions,
    authMode: providerData?.auth_mode,
    redirectUrl: providerData?.redirect_url,
    rawResponse: JSON.stringify(provider),
  });
  const refreshed = await store.getMobileMoneyTransaction(req.params.id, req.userId!);
  return res.json({ transaction: refreshed ?? transaction });
});

paymentsRouter.post('/mobile-money/:id/finalize', async (req: AuthRequest, res) => {
  const transaction = await store.getMobileMoneyTransaction(req.params.id, req.userId!);
  const otp = req.body?.otp;
  if (!transaction) return res.status(404).json({ error: 'Transaction introuvable' });
  if (transaction.authMode !== 'pin' || !transaction.providerTransactionId) {
    return res.status(409).json({ error: 'Cette transaction ne demande pas de code PIN' });
  }
  if (typeof otp !== 'string' || !/^\d{4,6}$/.test(otp.trim())) {
    return res.status(400).json({ error: 'Code PIN invalide' });
  }

  await finalizePayment(transaction.providerTransactionId, otp.trim());
  return res.status(202).json({ transaction });
});

paymentsRouter.post('/mobile-money/:id/resend-webhook', async (req: AuthRequest, res) => {
  const transaction = await store.getMobileMoneyTransaction(req.params.id, req.userId!);
  if (!transaction?.providerTransactionId) return res.status(404).json({ error: 'Transaction introuvable' });
  const provider = await resendWebhook(transaction.providerTransactionId);
  return res.json({ provider, transaction });
});

paymentsRouter.get('/reconciliation/mobile-money', async (req: AuthRequest, res) => {
  const user = await store.findUserById(req.userId!);
  if (!user || user.role !== 'organizer') return res.status(403).json({ error: 'Compte organisateur requis' });

  const page = req.query.page === 'all' ? 'all' : Number(req.query.page ?? 1);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  if (page !== 'all' && (!Number.isInteger(page) || page < 1)) return res.status(400).json({ error: 'Page invalide' });
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ error: 'Limite invalide' });

  const provider = await listTransactions({ page, limit });
  const reconciliation = await store.reconcileMobileMoneyTransactions(provider.data ?? []);
  return res.json({ provider, reconciliation });
});

paymentsRouter.get('/merchant-accounts/:organizerId', async (req, res) => {
  const paymentMethod = req.query.paymentMethod;
  if (!isPaymentMethodKey(paymentMethod)) {
    return res.status(400).json({ error: 'Moyen de paiement invalide' });
  }

  const account = await store.getMerchantAccount(req.params.organizerId, paymentMethod);
  return res.json({ merchantAccount: account });
});

paymentsRouter.put('/merchant-accounts/:organizerId', async (req: AuthRequest, res) => {
  const { paymentMethod, businessName, supportEmail, country, city, phoneNumber, payoutDetails } = req.body ?? {};

  if (!isPaymentMethodKey(paymentMethod)) {
    return res.status(400).json({ error: 'Moyen de paiement invalide' });
  }

  const user = await store.findUserById(req.userId!);
  if (!user || user.role !== 'organizer' || user.id !== req.params.organizerId) {
    return res.status(403).json({ error: 'Compte organisateur requis' });
  }

  const merchantAccount = await store.updateMerchantAccount(req.params.organizerId, paymentMethod, {
    businessName: typeof businessName === 'string' ? businessName : undefined,
    supportEmail: typeof supportEmail === 'string' ? supportEmail : undefined,
    country: typeof country === 'string' ? country : undefined,
    city: typeof city === 'string' ? city : undefined,
    phoneNumber: typeof phoneNumber === 'string' ? phoneNumber : undefined,
    payoutDetails: typeof payoutDetails === 'string' ? payoutDetails : undefined,
  });

  return res.json({ merchantAccount });
});
