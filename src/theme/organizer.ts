import { colors } from './colors';

export const organizerColors = {
  background: '#F4E8DA',
  backgroundAccent: 'rgba(242, 100, 59, 0.10)',
  surface: '#FFF9F4',
  surfaceAlt: '#FFF1E6',
  surfaceStrong: '#FFE6D7',
  border: 'rgba(52, 35, 20, 0.10)',
  borderStrong: 'rgba(52, 35, 20, 0.16)',
  text: colors.text,
  textSecondary: colors.textSecondary,
  textMuted: colors.textMuted,
  accent: colors.orange,
  accentSoft: colors.accentWash,
  success: colors.green,
  successSoft: 'rgba(76, 143, 106, 0.12)',
  warningSoft: 'rgba(246, 195, 91, 0.14)',
} as const;
