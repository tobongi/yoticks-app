import { Router } from 'express';
import { type PaymentMethodKey } from '../data';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { store } from '../lib/store';

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

function isPaymentMethodKey(value: unknown): value is PaymentMethodKey {
  return value === 'apple_pay' || value === 'google_pay' || value === 'paypal' || value === 'card';
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
