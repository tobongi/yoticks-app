import type { BackendEvent } from './backend';

export type ReservationTier = {
  key: string;
  title: string;
  subtitle: string;
  price: string;
  description: string;
  perks: string[];
  highlighted?: boolean;
};

export type ReservationFlowItem = {
  label: string;
  value: string;
};

export type ReservationFlowAction = {
  label: string;
};

export type PaymentMethodKey = 'apple_pay' | 'google_pay' | 'paypal' | 'card';

export type PaymentMethodOption = {
  key: PaymentMethodKey;
  label: string;
  detail: string;
  badge: string;
  actionLabel: string;
};

export type ReservationFlow = {
  reviewTitle: string;
  reviewSubtitle: string;
  paymentLabel: string;
  reviewItems: ReservationFlowItem[];
  primaryActionLabel: string;
  successTitle: string;
  successSubtitle: string;
  successActions: ReservationFlowAction[];
};

function parsePriceValue(price: string) {
  const value = Number(price.replace(/[^\d]/g, ''));
  return Number.isFinite(value) ? value : 0;
}

export function buildReservationFlow(event: BackendEvent, tier: ReservationTier): ReservationFlow {
  const free = parsePriceValue(tier.price) === 0;

  return {
    reviewTitle: `Récapitulatif de commande`,
    reviewSubtitle: `Vérifie les détails ci-dessous, puis confirme pour créer ta commande et ton billet mobile.`,
    paymentLabel: free ? 'Aucun paiement' : `À payer : ${tier.price}`,
    reviewItems: [
      { label: 'Billet', value: tier.title },
      { label: 'Événement', value: event.title },
      { label: 'Date', value: event.date },
      { label: 'Ville', value: event.location },
      { label: 'Livraison', value: 'Billet mobile + QR' },
    ],
    primaryActionLabel: free ? 'Confirmer la reservation' : 'Continuer vers le paiement',
    successTitle: 'Commande confirmée',
    successSubtitle: 'Ton billet est prêt. Ouvre les détails de la commande maintenant ou retrouve-le dans Mes billets.',
    successActions: [{ label: 'Voir mon billet' }, { label: 'Retour aux événements' }],
  };
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    key: 'apple_pay',
    label: 'Apple Pay',
    detail: 'Paiement rapide avec Face ID ou Touch ID',
    badge: 'Rapide',
    actionLabel: 'Payer avec Apple Pay',
  },
  {
    key: 'google_pay',
    label: 'Google Pay',
    detail: 'Paiement rapide sur Android',
    badge: 'Rapide',
    actionLabel: 'Payer avec Google Pay',
  },
  {
    key: 'paypal',
    label: 'PayPal',
    detail: 'Payer avec ton compte PayPal',
    badge: 'Populaire',
    actionLabel: 'Payer avec PayPal',
  },
  {
    key: 'card',
    label: 'Carte bancaire',
    detail: 'Visa, Mastercard et cartes locales',
    badge: 'Classique',
    actionLabel: 'Payer par carte',
  },
];
