import assert from 'node:assert/strict';
import test from 'node:test';
import { getMobileMoneyCountryOptions } from './payment-state';

test('publishes every supported country with explicit currency-specific networks', () => {
  const options = getMobileMoneyCountryOptions();
  const drc = options.find((country) => country.code === 'CD');
  const senegal = options.find((country) => country.code === 'SN');

  assert.equal(options.length, 11);
  assert.equal(drc?.name, 'République démocratique du Congo');
  assert.deepEqual(drc?.currencies.find((currency) => currency.code === 'CDF')?.networks, [
    'vodacom',
    'airtel',
    'orange',
    'africell',
  ]);
  assert.deepEqual(senegal?.currencies, [{ code: 'XOF', networks: ['orange', 'free', 'wave'] }]);
});
