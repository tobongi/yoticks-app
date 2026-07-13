import type { Locale } from './i18n';

export type LanguageOption = {
  locale: Locale;
  flag: string;
  shortLabel: string;
  nameKey: 'profile.languageFrench' | 'profile.languageEnglish';
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { locale: 'fr', flag: '🇫🇷', shortLabel: 'FR', nameKey: 'profile.languageFrench' },
  { locale: 'en', flag: '🇬🇧', shortLabel: 'EN', nameKey: 'profile.languageEnglish' },
];

export function getLanguageOption(locale: Locale) {
  return LANGUAGE_OPTIONS.find((option) => option.locale === locale) ?? LANGUAGE_OPTIONS[0];
}
