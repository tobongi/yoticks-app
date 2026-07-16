export function getCheckoutReadiness({ amount, paidCheckoutEnabled }: { amount: number; paidCheckoutEnabled: boolean }) {
  if (amount <= 0 || paidCheckoutEnabled) return { allowed: true as const, reason: null };
  return {
    allowed: false as const,
    reason: 'Le paiement en ligne n’est pas encore disponible pour cet événement.',
  };
}
