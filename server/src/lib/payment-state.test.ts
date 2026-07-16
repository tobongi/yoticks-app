import assert from 'node:assert/strict';
import test from 'node:test';
import { findProviderTransaction, fromProviderAmount, normalizeProviderStatus, preservePaymentStatus, providerAmountMatches, toProviderAmount, validateMobileMoneyInput, validateProviderMatch } from './payment-state';

test('normalizes MBIYOPAY and YoTicks statuses to one internal vocabulary', () => {
  assert.equal(normalizeProviderStatus('success'), 'successful');
  assert.equal(normalizeProviderStatus('processing'), 'pending');
  assert.equal(normalizeProviderStatus('declined'), 'failed');
  assert.equal(normalizeProviderStatus('cancelled'), 'cancelled');
});

test('never downgrades a terminal payment status from a late provider callback', () => {
  assert.equal(preservePaymentStatus('successful', 'failed'), 'successful');
  assert.equal(preservePaymentStatus('failed', 'pending'), 'failed');
  assert.equal(preservePaymentStatus('pending', 'successful'), 'successful');
});

test('accepts a supported DRC mobile-money payment input', () => {
  assert.deepEqual(validateMobileMoneyInput({
    amount: 5000,
    countryCode: 'CD',
    currency: 'CDF',
    network: 'vodacom',
    phoneNumber: '+243812345678',
  }), { valid: true });
});

test('converts application major units to the provider lowest denomination', () => {
  assert.equal(toProviderAmount(5000), 500000);
  assert.equal(fromProviderAmount('500000'), 5000);
  assert.equal(providerAmountMatches(5000, 500000), true);
  assert.equal(providerAmountMatches(5000, 5000), false);
});

test('uses the documented separate DRC USD and CDF limits', () => {
  assert.deepEqual(validateMobileMoneyInput({ amount: 0.1, countryCode: 'CD', currency: 'USD', network: 'vodacom', phoneNumber: '+243812345678' }), { valid: true });
  assert.deepEqual(validateMobileMoneyInput({ amount: 0.09, countryCode: 'CD', currency: 'USD', network: 'vodacom', phoneNumber: '+243812345678' }), { valid: false, reason: 'Amount must be between 0.1 and 2500 USD.' });
});

test('rejects a network that is not supported in the selected country', () => {
  assert.deepEqual(validateMobileMoneyInput({
    amount: 5000,
    countryCode: 'CD',
    currency: 'XOF',
    network: 'orange',
    phoneNumber: '+243812345678',
  }), { valid: false, reason: 'Currency XOF is not supported in CD.' });
});

test('rejects provider callbacks that do not match the local order', () => {
  assert.deepEqual(validateProviderMatch({
    expectedAmount: 5000,
    expectedCurrency: 'CDF',
    expectedOrderId: 'checkout_1',
    providerAmount: 5001,
    providerCurrency: 'CDF',
    providerOrderId: 'checkout_1',
  }), { valid: false, reason: 'Provider amount does not match checkout amount.' });
});

test('matches a provider transaction by either provider transaction id or order id', () => {
  assert.equal(findProviderTransaction([
    { id: 'provider_1', order_id: 'checkout_1' },
  ], 'provider_1', 'checkout_1')?.id, 'provider_1');
});
