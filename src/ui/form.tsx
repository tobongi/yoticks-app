import { forwardRef, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius, size, space, stroke } from '../theme/tokens';
import { focusRingStyle, interactionProps, useInteraction } from './interaction';

/**
 * Text field.
 *
 * The old inputs were bare `TextInput`s with a placeholder standing in for a
 * label. That fails twice over: the label vanishes the moment someone starts
 * typing, and a placeholder is not exposed as an accessible name. For an
 * audience that may not read confidently, a field whose label disappears
 * mid-entry is the fastest way to lose them. Every field now keeps a
 * persistent label, and errors are announced rather than only coloured.
 */
export const Input = forwardRef<TextInput, {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Shown under the field. Replaced by `error` when one is present. */
  helper?: string;
  /** Turns the field red and is read out by assistive tech. */
  error?: string;
  /** Leading affordance — a search glyph, a currency mark. */
  icon?: ReactNode;
  /** Trailing control — reveal password, clear the field. */
  trailing?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
} & Omit<TextInputProps, 'style' | 'value' | 'onChangeText'>>(function Input(
  { label, value, onChangeText, helper, error, icon, trailing, containerStyle, ...inputProps },
  ref,
) {
  const { hovered, focused, handlers } = useInteraction();
  const hasError = Boolean(error);

  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label} nativeID={`${label}-label`}>
        {label}
      </Text>

      <View
        style={[
          styles.inputShell,
          hovered && !focused && styles.inputShellHover,
          focused && styles.inputShellFocused,
          hasError && styles.inputShellError,
        ]}
      >
        {icon ? <View style={styles.inputIcon}>{icon}</View> : null}
        <TextInput
          ref={ref}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          aria-invalid={hasError}
          {...interactionProps(handlers)}
          {...inputProps}
        />
        {trailing ? <View style={styles.inputTrailing}>{trailing}</View> : null}
      </View>

      {hasError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
});

/**
 * Segmented control — two to four mutually exclusive options.
 *
 * Replaces the pattern of two chips where "selected" was signalled by colour
 * alone. PRODUCT.md is explicit that colour must never carry meaning on its
 * own, so the active segment also gets a filled surface, a weight change,
 * and `accessibilityState.selected`.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.segment} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <SegmentButton
            key={option.value}
            active={active}
            label={option.label}
            icon={option.icon}
            onPress={() => onChange(option.value)}
          />
        );
      })}
    </View>
  );
}

function SegmentButton({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon?: ReactNode;
  onPress: () => void;
}) {
  const { hovered, focused, handlers } = useInteraction();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      {...interactionProps(handlers)}
      style={[
        styles.segmentItem,
        hovered && !active && styles.segmentItemHover,
        active && styles.segmentItemActive,
        focusRingStyle(focused),
      ]}
    >
      {icon}
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A labelled on/off row. */
export function ToggleRow({
  label,
  description,
  value,
  onChange,
  icon,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: ReactNode;
}) {
  const { hovered, focused, handlers } = useInteraction();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={description}
      onPress={() => onChange(!value)}
      {...interactionProps(handlers)}
      style={[styles.toggleRow, hovered && styles.toggleRowHover, focusRingStyle(focused)]}
    >
      {icon ? <View style={styles.toggleIcon}>{icon}</View> : null}
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDescription}>{description}</Text> : null}
      </View>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.sm },
  label: { ...typography.text.label, color: colors.text },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.controlMd,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: stroke.hairline,
    borderColor: colors.borderStrong,
    paddingHorizontal: space.md,
  },
  inputShellHover: { borderColor: colors.textMuted },
  inputShellFocused: { borderColor: colors.focusRing, borderWidth: stroke.medium },
  inputShellError: { borderColor: colors.error, backgroundColor: colors.errorSurface },
  inputIcon: { alignItems: 'center', justifyContent: 'center' },
  inputTrailing: { alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    paddingVertical: space.md,
    ...typography.text.body,
    color: colors.text,
    // React Native Web draws its own outline on the inner input; the shell
    // above already renders the focus state for the whole control.
    outlineStyle: 'none',
  } as never,
  helper: { ...typography.text.meta, color: colors.textMuted },
  error: { ...typography.text.meta, color: colors.error },

  segment: {
    flexDirection: 'row',
    gap: space.xs,
    padding: space.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: size.touchMin - space.sm,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
  },
  segmentItemHover: { backgroundColor: colors.cardHover },
  segmentItemActive: { backgroundColor: colors.card },
  segmentLabel: { ...typography.text.label, color: colors.textSecondary },
  segmentLabelActive: { color: colors.text },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 68,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: stroke.hairline,
    borderColor: colors.border,
  },
  toggleRowHover: { borderColor: colors.borderStrong },
  toggleIcon: { alignItems: 'center', justifyContent: 'center' },
  toggleCopy: { flex: 1, gap: space.xxs },
  toggleLabel: { ...typography.text.subheading, fontSize: typography.fontSize.base, color: colors.text },
  toggleDescription: { ...typography.text.meta, color: colors.textMuted },
  track: {
    width: 52,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    borderWidth: stroke.hairline,
    borderColor: colors.borderStrong,
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: colors.greenInk, borderColor: colors.greenInk },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  thumbOn: { alignSelf: 'flex-end' },
});
