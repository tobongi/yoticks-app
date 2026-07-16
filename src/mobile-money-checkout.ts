export const CHECKOUT_POLL_INTERVAL_MS = 4_000;
export const CHECKOUT_PENDING_TIMEOUT_MS = 90_000;

export type MobileMoneyStatus = 'pending' | 'successful' | 'failed' | 'cancelled';

export type MobileMoneyCurrencyOption = {
  code: string;
  networks: string[];
};

export type MobileMoneyCountryOption = {
  code: string;
  name: string;
  currencies: MobileMoneyCurrencyOption[];
};

export function getNetworksForSelection(
  options: MobileMoneyCountryOption[],
  countryCode: string,
  currencyCode: string,
): string[] {
  if (!countryCode || !currencyCode) return [];
  return options
    .find((country) => country.code === countryCode)
    ?.currencies.find((currency) => currency.code === currencyCode)
    ?.networks.slice() ?? [];
}

export function getPendingTiming(startedAtMs: number, nowMs: number) {
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  const elapsedSeconds = Math.floor(elapsedMs / 1_000);
  const remainingSeconds = Math.max(0, Math.ceil((CHECKOUT_PENDING_TIMEOUT_MS - elapsedMs) / 1_000));
  return {
    elapsedSeconds,
    remainingSeconds,
    timedOut: elapsedMs >= CHECKOUT_PENDING_TIMEOUT_MS,
  };
}

export function getCheckoutActions(status: MobileMoneyStatus) {
  return {
    canRefresh: status === 'pending',
    canRetry: status === 'failed' || status === 'cancelled',
    canViewTickets: status === 'successful',
  };
}

export function sanitizeProviderInstructions(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
