import assert from 'node:assert/strict';
import test from 'node:test';

import type { Locale } from './i18n';
import { useI18n } from './i18n';
import { getLanguageOption, LANGUAGE_OPTIONS } from './language-options';

test('placeholder sanity for i18n module exports', () => {
  assert.equal(typeof useI18n, 'function');
});

test('translation fallback logic prefers requested locale and falls back to french semantics', async () => {
  const module = await import('./i18n');
  const privateResolve = (module as unknown as { __testResolve?: (locale: Locale, key: string) => string | undefined }).__testResolve;
  assert.equal(typeof privateResolve, 'function');
  assert.equal(privateResolve?.('en', 'tabs.search'), 'Search');
  assert.equal(privateResolve?.('fr', 'tabs.search'), 'Recherche');
  assert.equal(privateResolve?.('fr', 'home.allCities'), 'Toutes les villes');
  assert.equal(privateResolve?.('en', 'home.allCities'), 'All cities');
  assert.equal(privateResolve?.('fr', 'onboarding.back'), 'Retour');
  assert.equal(privateResolve?.('en', 'onboarding.startExploring'), 'Start exploring');
  assert.equal(privateResolve?.('en', 'missing.key'), undefined);
});

test('language selector options stay stable for supported locales', () => {
  assert.deepEqual(
    LANGUAGE_OPTIONS.map((option) => option.locale),
    ['fr', 'en'],
  );
  assert.equal(getLanguageOption('fr').shortLabel, 'FR');
  assert.equal(getLanguageOption('fr').flag, '🇫🇷');
  assert.equal(getLanguageOption('en').shortLabel, 'EN');
  assert.equal(getLanguageOption('en').flag, '🇬🇧');
});
