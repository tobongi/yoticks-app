import { colors } from './colors';

/**
 * Organiser surfaces.
 *
 * These used to be an entirely separate palette — a #F4E8DA canvas against
 * the attendee app's #FFF5EF, with its own borders and surfaces. The result
 * was that YoTicks read as two products stitched together, and every shared
 * component had to be checked twice.
 *
 * The organiser role is now signalled the way roles should be — by what is
 * on the screen and by the accent on primary controls — not by repainting
 * the whole canvas. Every token below maps onto the shared semantic scale,
 * so anything built for one side of the app is correct on the other, and the
 * contrast guarantees in `colors.test.ts` cover both.
 *
 * Kept as a named export rather than inlined so organiser screens keep a
 * clear seam if the two ever genuinely need to diverge.
 */
export const organizerColors = {
  background: colors.bgDeep,
  backgroundAccent: colors.accentWash,
  surface: colors.card,
  surfaceAlt: colors.cardStrong,
  surfaceStrong: colors.surfaceSunken,
  border: colors.border,
  borderStrong: colors.borderStrong,
  text: colors.text,
  textSecondary: colors.textSecondary,
  textMuted: colors.textMuted,
  accent: colors.orange,
  /** Use for organiser accent TEXT — the fill orange fails contrast as text. */
  accentInk: colors.orangeInk,
  accentSoft: colors.surfaceOrange,
  success: colors.greenInk,
  successSoft: colors.surfaceGreen,
  warningSoft: colors.surfaceYellow,
} as const;
