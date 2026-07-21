/**
 * Scrim geometry for text over event photography.
 *
 * Kept free of React Native imports so it can be unit-tested directly — the
 * same split as `responsive-core.ts`. The component lives in
 * `image-scrim.tsx` and reads its values from here.
 *
 * A flat scrim cannot win this argument. Measured against the worst case —
 * white text on an all-white photo — a flat 0.46 overlay gives 3.10:1. That
 * clears the 3:1 large-text threshold, so headings were fine, but the 12 and
 * 14px meta lines beneath them (category, city, date) need 4.5:1 and were
 * failing on the live site. Raising the flat value to 0.62 would fix the
 * numbers and drain the colour out of every photo in the app.
 *
 * So the scrim is weighted instead. Text always sits at the bottom of these
 * cards, so the gradient stays light across the top of the image and reaches
 * 0.72 through the lower third, where it composites to 7.4:1 on a white
 * photo. The picture keeps its colour and the type stays legible on any
 * source image, including the blown-out ones we do not control.
 */

/** Opacity at the top of the image. Enough to lift a pale sky, no more. */
export const SCRIM_TOP_OPACITY = 0.08;
/**
 * Opacity partway down, where a tall card's heading can sit.
 * Floor is 0.46 — below that a heading at the midpoint drops under 3:1 on a
 * white photo. 0.50 keeps a little margin.
 */
export const SCRIM_MID_OPACITY = 0.5;
/** Opacity where the gradient reaches the meta text. */
export const SCRIM_TEXT_ZONE_OPACITY = 0.72;
/** Height fraction at which the gradient hits `SCRIM_MID_OPACITY`. */
export const SCRIM_MID_STOP = 0.45;

export const SCRIM_INK = '#17130F';
