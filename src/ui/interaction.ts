import { useCallback, useMemo, useState } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { stroke } from '../theme/tokens';

/**
 * Interaction state for a control.
 *
 * Every control in the app now renders a real focus state. The previous kit
 * used bare `Pressable`s with only a pressed style, which left the web build
 * impossible to operate from a keyboard — no visible ring, no indication of
 * where you were. `hovered` is web-only; React Native simply never fires it.
 */
export type InteractionState = {
  hovered: boolean;
  focused: boolean;
};

export type InteractionHandlers = {
  onHoverIn: () => void;
  onHoverOut: () => void;
  onFocus: () => void;
  onBlur: () => void;
};

export function useInteraction(): InteractionState & { handlers: InteractionHandlers } {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const onHoverIn = useCallback(() => setHovered(true), []);
  const onHoverOut = useCallback(() => setHovered(false), []);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);

  const handlers = useMemo(
    () => ({ onHoverIn, onHoverOut, onFocus, onBlur }),
    [onBlur, onFocus, onHoverIn, onHoverOut],
  );

  return { hovered, focused, handlers };
}

/**
 * The focus ring. Drawn as an outline rather than a border so it never
 * changes the control's box and shifts the layout underneath it.
 *
 * `colors.focusRing` is the deep orange, which clears 3:1 against both the
 * canvas and white cards — the WCAG 2.2 non-text contrast threshold.
 */
export function focusRingStyle(focused: boolean): ViewStyle {
  if (!focused) {
    return {};
  }

  if (Platform.OS === 'web') {
    return {
      outlineStyle: 'solid',
      outlineColor: colors.focusRing,
      outlineWidth: stroke.focus,
      outlineOffset: 2,
    } as ViewStyle;
  }

  return {
    borderColor: colors.focusRing,
    borderWidth: stroke.focus,
  };
}

/**
 * Props to spread onto a `Pressable` so it reports hover and focus.
 * Kept as a plain object so it can be spread next to other props.
 */
export function interactionProps(handlers: InteractionHandlers) {
  return {
    onHoverIn: handlers.onHoverIn,
    onHoverOut: handlers.onHoverOut,
    onFocus: handlers.onFocus,
    onBlur: handlers.onBlur,
  };
}
