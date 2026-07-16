export type MobileMoneyValidationInput = {
  amount: number;
  countryCode: string;
  currency: string;
  network: string;
  phoneNumber: string;
  omOtp?: string;
};

type CountryRule = {
  currencies: string[];
  networks: string[];
  min: number;
  max: number;
};

export type MobileMoneyCountryOption = {
  code: string;
  name: string;
  currencies: { code: string; networks: string[] }[];
};

const MBIYOPAY_COUNTRY_NAMES: Record<string, string> = {
  BF: 'Burkina Faso',
  BJ: 'Bénin',
  CG: 'Congo',
  CD: 'République démocratique du Congo',
  CM: 'Cameroun',
  CI: "Côte d'Ivoire",
  GM: 'Gambie',
  GN: 'Guinée',
  ML: 'Mali',
  SN: 'Sénégal',
  TG: 'Togo',
};

export const MBIYOPAY_COUNTRY_RULES: Record<string, CountryRule | Record<string, CountryRule>> = {
  BF: { currencies: ['XOF'], networks: ['orange', 'moov', 'coris'], min: 500, max: 1_500_000 },
  BJ: { currencies: ['XOF'], networks: ['mtn', 'moov', 'celtiis'], min: 50, max: 1_500_000 },
  CG: { currencies: ['XAF'], networks: ['mtn'], min: 500, max: 1_500_000 },
  CD: {
    CDF: { currencies: ['CDF'], networks: ['vodacom', 'airtel', 'orange', 'africell'], min: 40, max: 5_000_000 },
    USD: { currencies: ['USD'], networks: ['vodacom', 'airtel', 'orange', 'africell'], min: 0.1, max: 2_500 },
  },
  CM: { currencies: ['XAF'], networks: ['orange', 'mtn'], min: 50, max: 1_500_000 },
  CI: { currencies: ['XOF'], networks: ['orange', 'mtn', 'wave', 'moov'], min: 500, max: 1_500_000 },
  GM: { currencies: ['GMD'], networks: ['afrimoney', 'qmoney', 'wave', 'aps'], min: 10, max: 200_000 },
  GN: { currencies: ['GNF'], networks: ['orange', 'mtn'], min: 500, max: 1_500_000 },
  ML: { currencies: ['XOF'], networks: ['orange', 'moov'], min: 500, max: 1_500_000 },
  SN: { currencies: ['XOF'], networks: ['orange', 'free', 'wave'], min: 500, max: 1_500_000 },
  TG: { currencies: ['XOF'], networks: ['moov', 'togocom'], min: 500, max: 1_500_000 },
};

export function getMobileMoneyCountryOptions(): MobileMoneyCountryOption[] {
  return Object.entries(MBIYOPAY_COUNTRY_RULES).map(([code, countryRule]) => {
    const rules = 'currencies' in countryRule
      ? (countryRule as CountryRule).currencies.map((currency) => [currency, countryRule as CountryRule] as const)
      : Object.entries(countryRule as Record<string, CountryRule>);
    return {
      code,
      name: MBIYOPAY_COUNTRY_NAMES[code] ?? code,
      currencies: rules.map(([currency, rule]) => ({ code: currency, networks: rule.networks.slice() })),
    };
  });
}

export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'cancelled';

export function toProviderAmount(amount: number): number {
  return Math.round(amount * 100);
}

export function fromProviderAmount(amount: number | string): number {
  return Number(amount) / 100;
}

export function findProviderTransaction<T extends { id?: string; transaction_id?: string; order_id?: string }>(items: T[], providerTransactionId?: string | null, orderId?: string | null): T | undefined {
  return items.find((item) =>
    (providerTransactionId && (item.id === providerTransactionId || item.transaction_id === providerTransactionId)) ||
    (orderId && item.order_id === orderId),
  );
}

export function normalizeProviderStatus(status: string | undefined): PaymentStatus {
  switch (status?.trim().toLowerCase()) {
    case 'success':
    case 'successful':
      return 'successful';
    case 'processing':
    case 'pending':
      return 'pending';
    case 'declined':
    case 'failed':
      return 'failed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

export function preservePaymentStatus(current: PaymentStatus, incoming: PaymentStatus): PaymentStatus {
  if (current === 'successful') return 'successful';
  if (current === 'failed' || current === 'cancelled') return current;
  return incoming;
}

export function validateMobileMoneyInput(input: MobileMoneyValidationInput): { valid: true } | { valid: false; reason: string } {
  const countryCode = input.countryCode.trim().toUpperCase();
  const currency = input.currency.trim().toUpperCase();
  const network = input.network.trim().toLowerCase();
  const countryRule = MBIYOPAY_COUNTRY_RULES[countryCode];

  if (!countryRule) return { valid: false, reason: `Country ${countryCode} is not supported.` };
  let rule: CountryRule | undefined;
  if ('currencies' in countryRule) rule = countryRule as CountryRule;
  else rule = (countryRule as Record<string, CountryRule>)[currency];
  if (!rule) return { valid: false, reason: `Currency ${currency} is not supported in ${countryCode}.` };
  if (!rule.currencies.includes(currency)) return { valid: false, reason: `Currency ${currency} is not supported in ${countryCode}.` };
  if (!rule.networks.includes(network)) return { valid: false, reason: `Network ${network} is not supported in ${countryCode}.` };
  if (!Number.isFinite(input.amount) || input.amount < rule.min || input.amount > rule.max) {
    return { valid: false, reason: `Amount must be between ${rule.min} and ${rule.max} ${currency}.` };
  }
  if (!/^\+?[0-9][0-9\s().-]{6,20}$/.test(input.phoneNumber.trim())) {
    return { valid: false, reason: 'Phone number is invalid.' };
  }
  if (input.omOtp !== undefined && !/^\d{4,6}$/.test(input.omOtp.trim())) {
    return { valid: false, reason: 'OTP is invalid.' };
  }
  return { valid: true };
}

export function providerAmountMatches(expectedAmount: number, providerAmount: number | string | null): boolean {
  if (providerAmount === null) return false;
  return Math.abs(fromProviderAmount(providerAmount) - expectedAmount) < 0.000001;
}

export function validateProviderMatch(input: {
  expectedAmount: number;
  expectedCurrency: string;
  expectedOrderId: string;
  providerAmount?: number | string | null;
  providerCurrency?: string | null;
  providerOrderId?: string | null;
}): { valid: true } | { valid: false; reason: string } {
  if (input.providerOrderId !== input.expectedOrderId) return { valid: false, reason: 'Provider order does not match checkout order.' };
  if (Number(input.providerAmount) !== input.expectedAmount) return { valid: false, reason: 'Provider amount does not match checkout amount.' };
  if (input.providerCurrency?.trim().toUpperCase() !== input.expectedCurrency.trim().toUpperCase()) {
    return { valid: false, reason: 'Provider currency does not match checkout currency.' };
  }
  return { valid: true };
}
