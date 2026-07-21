import { StyleSheet } from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';
import {
  SCRIM_INK,
  SCRIM_MID_OPACITY,
  SCRIM_MID_STOP,
  SCRIM_TEXT_ZONE_OPACITY,
  SCRIM_TOP_OPACITY,
} from './image-scrim-core';

/**
 * The overlay that makes text readable on top of event photography.
 * See `image-scrim-core.ts` for why this is a gradient and not a flat fill;
 * the contrast guarantee is asserted in `image-scrim.test.ts`.
 *
 * `id` must be unique per instance: SVG gradient ids are document-global on
 * web, so two scrims sharing one id would make the second reuse the first's
 * definition.
 */
export function ImageScrim({ id = 'default' }: { id?: string }) {
  const gradientId = `yoticksScrim-${id}`;
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none" aria-hidden>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={SCRIM_INK} stopOpacity={SCRIM_TOP_OPACITY} />
          <Stop offset={String(SCRIM_MID_STOP)} stopColor={SCRIM_INK} stopOpacity={SCRIM_MID_OPACITY} />
          <Stop offset="1" stopColor={SCRIM_INK} stopOpacity={SCRIM_TEXT_ZONE_OPACITY} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
    </Svg>
  );
}
