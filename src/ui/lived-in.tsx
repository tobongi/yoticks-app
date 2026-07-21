import { useEffect, useRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { elevation } from '../theme/shadows';
import { typography } from '../theme/typography';
import { duration, opacity, radius, size, space, stroke } from '../theme/tokens';
import { focusRingStyle, interactionProps, useInteraction } from './interaction';
import { Pictogram } from './pictograms';
import { getCategoryVisual, type PictogramKey, type VisualTone } from './visual-language';

type Tone = VisualTone;

/**
 * How each tone renders in the four places a colour can appear.
 *
 * `fill` is only ever paired with `onFill`, and every one of those pairs is
 * contrast-tested in `theme/colors.test.ts`. Note that green's fill is the
 * *ink* green: the lighter #4D8F6A only reaches 3.85:1 against white, which
 * is not good enough for button text.
 */
const toneMap: Record<
  Tone,
  { fill: string; onFill: string; ink: string; border: string; soft: string }
> = {
  orange: {
    fill: colors.orange,
    onFill: colors.onAccent,
    ink: colors.orangeInk,
    border: colors.borderOrange,
    soft: colors.surfaceOrange,
  },
  green: {
    fill: colors.greenInk,
    onFill: colors.onDark,
    ink: colors.greenInk,
    border: 'rgba(47,107,72,0.28)',
    soft: colors.surfaceGreen,
  },
  yellow: {
    fill: colors.yellow,
    onFill: colors.onAccent,
    ink: colors.yellowInk,
    border: 'rgba(122,84,6,0.24)',
    soft: colors.surfaceYellow,
  },
  blue: {
    fill: colors.blue,
    onFill: colors.onDark,
    ink: colors.blueInk,
    border: 'rgba(42,85,176,0.26)',
    soft: colors.surfaceBlue,
  },
  red: {
    fill: colors.red,
    onFill: colors.onDark,
    ink: colors.redInk,
    border: 'rgba(184,28,35,0.26)',
    soft: colors.surfaceRed,
  },
  ink: {
    fill: colors.black,
    onFill: colors.onDark,
    ink: colors.text,
    border: colors.borderStrong,
    soft: colors.cardHover,
  },
};

export function getTonePalette(tone: Tone) {
  return toneMap[tone];
}

/**
 * @deprecated Renders nothing.
 *
 * This used to paint two translucent blur orbs and a fake grid behind every
 * screen. It read as generic template decoration, fought the photography on
 * card thumbnails, and added a full-screen overdraw on cheap GPUs for no
 * information gain. Depth now comes from the elevation scale and the warm
 * canvas. Kept as a no-op so screens can drop it incrementally.
 */
export function LivedBackground() {
  return null;
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

export function ScreenHeader({
  eyebrow,
  title,
  side,
}: {
  eyebrow?: string;
  title: string;
  side?: ReactNode;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {side}
    </View>
  );
}

/**
 * The primary panel on a screen.
 *
 * Restructured: the decorative art used to sit in a row *beside* the title,
 * where a 96pt illustration plus its 72pt minimum width squeezed the heading
 * into a 157pt column — "Trouve les meilleurs plans" wrapped onto four
 * lines at 30px. The art now shares the top row with the eyebrow and the
 * title runs the full width of the panel. Decoration no longer outranks the
 * one sentence the screen exists to say.
 */
export function HeroPanel({
  title,
  subtitle,
  eyebrow,
  tone = 'orange',
  art,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  tone?: Tone;
  art?: ReactNode;
  children?: ReactNode;
}) {
  const palette = toneMap[tone];
  return (
    <View style={[styles.heroPanel, { borderColor: palette.border }]}>
      {eyebrow || art ? (
        <View style={styles.heroTop}>
          {eyebrow ? (
            <View style={[styles.heroEyebrow, { backgroundColor: palette.soft, borderColor: palette.border }]}>
              <Text style={[styles.heroEyebrowText, { color: palette.ink }]} numberOfLines={1}>
                {eyebrow}
              </Text>
            </View>
          ) : (
            <View />
          )}
          {art ? <View style={styles.heroArt}>{art}</View> : null}
        </View>
      ) : null}

      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
      </View>

      {children}
    </View>
  );
}

export function SectionBlock({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTop}>
        <View style={styles.sectionCopy}>
          {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

/** A plain surface. Use instead of hand-rolling a bordered View. */
export function Card({
  children,
  style,
  tone,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: Tone;
  padded?: boolean;
}) {
  const palette = tone ? toneMap[tone] : null;
  return (
    <View
      style={[
        styles.card,
        padded && styles.cardPadded,
        palette ? { backgroundColor: palette.soft, borderColor: palette.border } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * The one button in the app.
 *
 * Covers every state the brief calls for: default, hover, pressed, focus,
 * disabled, and loading. Loading keeps the label mounted and swaps in a
 * spinner beside it so the control does not resize mid-tap — a button that
 * changes width under a moving thumb causes mis-taps.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  tone = 'orange',
  buttonSize = 'md',
  icon,
  disabled = false,
  loading = false,
  fullWidth = true,
  accessibilityHint,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  tone?: Tone;
  buttonSize?: ButtonSize;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = toneMap[variant === 'danger' ? 'red' : tone];
  const { hovered, focused, handlers } = useInteraction();
  const isInert = disabled || loading;

  const height =
    buttonSize === 'sm' ? size.controlSm : buttonSize === 'lg' ? size.controlLg : size.controlMd;

  const filled = variant === 'primary' || variant === 'danger';
  const background = filled
    ? palette.fill
    : variant === 'secondary'
      ? colors.card
      : 'transparent';
  const foreground = filled ? palette.onFill : palette.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInert, busy: loading }}
      disabled={isInert}
      onPress={onPress}
      {...interactionProps(handlers)}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: height,
          backgroundColor: background,
          borderColor: filled ? palette.fill : variant === 'ghost' ? 'transparent' : colors.borderStrong,
          paddingHorizontal: buttonSize === 'sm' ? space.md : space.lg,
        },
        fullWidth && styles.buttonFullWidth,
        filled && elevation.sm,
        hovered && !isInert && (filled ? styles.buttonFilledHover : styles.buttonQuietHover),
        pressed && !isInert && styles.buttonPressed,
        isInert && styles.buttonDisabled,
        focusRingStyle(focused),
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={foreground} /> : icon}
      <Text
        style={[
          buttonSize === 'sm' ? styles.buttonLabelSm : styles.buttonLabel,
          { color: foreground },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The single most important action on a screen.
 *
 * Keeps the large pictogram: PRODUCT.md is explicit that this audience reads
 * icons faster than words, and the icon is what makes the button findable at
 * a glance in a queue. The icon is sized down from 46 to 32 so it supports
 * the label instead of overwhelming it.
 */
export function PrimaryAction({
  label,
  pictogram,
  onPress,
  tone = 'orange',
  disabled = false,
  loading = false,
  accessibilityHint,
}: {
  label: string;
  pictogram: PictogramKey;
  onPress?: () => void;
  tone?: Tone;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}) {
  const palette = toneMap[tone];
  const { hovered, focused, handlers } = useInteraction();
  const isInert = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInert, busy: loading }}
      disabled={isInert}
      onPress={onPress}
      {...interactionProps(handlers)}
      style={({ pressed }) => [
        styles.primaryAction,
        { backgroundColor: palette.fill },
        elevation.sm,
        hovered && !isInert && styles.buttonFilledHover,
        pressed && !isInert && styles.primaryActionPressed,
        isInert && styles.buttonDisabled,
        focusRingStyle(focused),
      ]}
    >
      <View style={styles.primaryActionIcon}>
        {loading ? (
          <ActivityIndicator size="small" color={palette.onFill} />
        ) : (
          <Pictogram pictogram={pictogram} tone={tone} size={32} />
        )}
      </View>
      <Text style={[styles.primaryActionText, { color: palette.onFill }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ActionTile({
  icon,
  label,
  hint,
  onPress,
  tone = 'orange',
  style,
  accessibilityLabel,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onPress?: () => void;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const palette = toneMap[tone];
  const { hovered, focused, handlers } = useInteraction();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={hint}
      onPress={onPress}
      {...interactionProps(handlers)}
      style={({ pressed }) => [
        styles.actionTile,
        { backgroundColor: palette.soft, borderColor: palette.border },
        hovered && styles.actionTileHover,
        pressed && styles.actionTilePressed,
        focusRingStyle(focused),
        style,
      ]}
    >
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel} numberOfLines={2}>
        {label}
      </Text>
      {hint ? (
        <Text style={styles.actionHint} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function Chip({
  label,
  active = false,
  onPress,
  accessibilityLabel,
  pictogram,
  tone = 'orange',
  count,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  pictogram?: PictogramKey;
  tone?: Tone;
  /** Rendered as a separate pill so the count never disappears into the label. */
  count?: number;
}) {
  const { hovered, focused, handlers } = useInteraction();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      {...interactionProps(handlers)}
      style={({ pressed }) => [
        styles.chip,
        hovered && !active && styles.chipHover,
        active && styles.chipActive,
        pressed && styles.chipPressed,
        focusRingStyle(focused),
      ]}
    >
      {pictogram ? <Pictogram pictogram={pictogram} tone={active ? 'ink' : tone} size={24} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
      {typeof count === 'number' ? (
        <View style={[styles.chipCount, active && styles.chipCountActive]}>
          <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Non-interactive status marker. Use `Chip` when it can be tapped. */
export function Badge({ label, tone = 'ink' }: { label: string; tone?: Tone }) {
  const palette = toneMap[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.soft, borderColor: palette.border }]}>
      <Text style={[styles.badgeText, { color: palette.ink }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export function StatRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={styles.statRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.statCard} accessibilityLabel={`${item.label}: ${item.value}`}>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {item.value}
          </Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function VisualCard({
  title,
  subtitle,
  meta,
  imageUrl,
  badge,
  onPress,
  right,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  imageUrl?: string;
  badge?: string;
  onPress?: () => void;
  right?: ReactNode;
  accessibilityLabel?: string;
}) {
  const visual = getCategoryVisual(subtitle ?? '');
  const { hovered, focused, handlers } = useInteraction();

  const content = (
    <>
      {imageUrl ? (
        <ImageBackground source={{ uri: imageUrl }} style={styles.cardThumb} imageStyle={styles.cardThumbImage}>
          <View style={styles.cardOverlay} />
          <View style={styles.cardPictogram}>
            <Pictogram pictogram={visual.key} tone={visual.tone} size={26} />
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.cardThumbFallback}>
          <Pictogram pictogram={visual.key} tone={visual.tone} size={44} />
        </View>
      )}
      <View style={styles.visualCardBody}>
        <Text style={styles.visualCardTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.visualCardSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text style={styles.visualCardMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {badge ? (
          <View style={styles.visualCardBadge}>
            <Text style={styles.visualCardBadgeText} numberOfLines={1}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );

  const interactiveStyle = ({ pressed }: { pressed: boolean }) => [
    styles.visualCard,
    hovered && styles.visualCardHover,
    pressed && styles.visualCardPressed,
    focusRingStyle(focused),
  ];

  if (right) {
    return (
      <View style={[styles.visualCard, styles.visualCardSplit]}>
        {onPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? title}
            onPress={onPress}
            {...interactionProps(handlers)}
            style={({ pressed }) => [
              styles.visualCardMain,
              pressed && styles.visualCardPressed,
              focusRingStyle(focused),
            ]}
          >
            {content}
          </Pressable>
        ) : (
          <View style={styles.visualCardMain}>{content}</View>
        )}
        <View style={styles.visualCardRight}>{right}</View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      {...interactionProps(handlers)}
      style={interactiveStyle}
    >
      {content}
    </Pressable>
  );
}

export function MetaPill({
  pictogram,
  tone = 'ink',
  label,
  value,
}: {
  pictogram: PictogramKey;
  tone?: Tone;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaPill} accessibilityLabel={`${label}: ${value}`}>
      <Pictogram pictogram={pictogram} tone={tone} size={32} />
      <View style={styles.metaPillCopy}>
        <Text style={styles.metaPillLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.metaPillValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ProgressBar({
  value,
  total,
  tone = 'orange',
  label,
}: {
  value: number;
  total: number;
  tone?: Tone;
  label?: string;
}) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: value }}
      accessibilityLabel={label}
      style={styles.progressTrack}
    >
      <View style={[styles.progressFill, { width: `${ratio * 100}%`, backgroundColor: toneMap[tone].fill }]} />
    </View>
  );
}

export function InlineScroll({
  children,
  contentContainerStyle,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.inlineScrollContent, contentContainerStyle]}
    >
      {children}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/**
 * Loading placeholder.
 *
 * Every screen previously rendered hard-coded demo data while its real
 * request was in flight, so content silently changed under the user a second
 * after it appeared. A skeleton says "this is still arriving" instead of
 * lying about the answer.
 */
export function Skeleton({
  height = 16,
  width = '100%',
  rounded = radius.sm,
  style,
}: {
  height?: number;
  width?: number | `${number}%`;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height, width, borderRadius: rounded, backgroundColor: colors.skeleton, opacity: pulse }, style]}
    />
  );
}

/** Skeleton shaped like a `VisualCard`, so lists do not jump when data lands. */
export function SkeletonCard() {
  return (
    <View style={[styles.visualCard, styles.skeletonCard]}>
      <Skeleton height={72} width={72} rounded={radius.md} />
      <View style={styles.skeletonBody}>
        <Skeleton height={18} width="80%" />
        <Skeleton height={14} width="45%" />
        <Skeleton height={14} width="60%" />
      </View>
    </View>
  );
}

/**
 * Empty state. Always carries one obvious next action — DESIGN.md requires
 * it and an empty screen with no exit is the fastest way to lose someone who
 * is not confident reading.
 */
export function EmptyState({
  art,
  title,
  action,
}: {
  art?: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.stateCard}>
      {art}
      <Text style={styles.stateTitle}>{title}</Text>
      {action}
    </View>
  );
}

/**
 * Error state.
 *
 * Screens used to call `.then(setState)` with no `.catch()`, so a failed
 * request left stale demo data on screen forever. This gives that failure
 * somewhere to go, and always offers a retry.
 */
export function ErrorState({
  title = 'Ça n’a pas marché',
  onRetry,
  retryLabel = 'Réessayer',
}: {
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <View style={[styles.stateCard, styles.errorCard]}>
      <Pictogram pictogram="help" tone="red" size={64} />
      <Text style={styles.stateTitle}>{title}</Text>
      {onRetry ? (
        <Button label={retryLabel} onPress={onRetry} variant="secondary" fullWidth={false} buttonSize="sm" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Structure ---------------------------------------------------------
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.md,
  },
  headerCopy: { flex: 1, gap: space.xs },
  eyebrow: { ...typography.text.eyebrow, color: colors.textMuted },
  headerTitle: { ...typography.text.title, color: colors.text },

  heroPanel: {
    overflow: 'hidden',
    borderRadius: radius.xxl,
    borderWidth: stroke.hairline,
    backgroundColor: colors.card,
    padding: space.xl,
    gap: space.lg,
    ...elevation.sm,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.md,
  },
  // Full width: the title is the point of the panel, not the illustration.
  heroCopy: { gap: space.sm },
  heroEyebrow: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radius.pill,
    borderWidth: stroke.hairline,
    flexShrink: 1,
  },
  heroEyebrowText: typography.text.eyebrow,
  heroTitle: { ...typography.text.display, fontSize: typography.fontSize['2xl'], lineHeight: 36, color: colors.text },
  heroSubtitle: { ...typography.text.body, color: colors.textSecondary },
  heroArt: { alignItems: 'center', justifyContent: 'center' },

  section: { gap: space.md },
  sectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: space.md,
  },
  sectionCopy: { flex: 1, gap: space.xxs },
  sectionEyebrow: { ...typography.text.eyebrow, color: colors.textMuted },
  sectionTitle: { ...typography.text.heading, color: colors.text },

  card: {
    borderRadius: radius.lg,
    borderWidth: stroke.hairline,
    borderColor: colors.border,
    backgroundColor: colors.card,
    ...elevation.sm,
  },
  cardPadded: { padding: space.lg },
  divider: { height: stroke.hairline, backgroundColor: colors.border },

  // --- Actions -----------------------------------------------------------
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: stroke.hairline,
  },
  buttonFullWidth: { alignSelf: 'stretch' },
  buttonLabel: { ...typography.text.action },
  buttonLabelSm: { ...typography.text.label },
  buttonFilledHover: { opacity: 0.92 },
  buttonQuietHover: { backgroundColor: colors.cardHover },
  buttonPressed: { opacity: opacity.pressed, transform: [{ scale: 0.985 }] },
  buttonDisabled: { opacity: opacity.disabled },

  primaryAction: {
    minHeight: size.controlLg,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  primaryActionPressed: { transform: [{ scale: 0.985 }], opacity: opacity.pressed },
  primaryActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: { ...typography.text.action, fontSize: typography.fontSize.md, flexShrink: 1 },

  actionTile: {
    minWidth: 104,
    minHeight: 124,
    borderRadius: radius.lg,
    borderWidth: stroke.hairline,
    padding: space.md,
    gap: space.sm,
    justifyContent: 'center',
  },
  actionTileHover: { transform: [{ translateY: -2 }] },
  actionTilePressed: { opacity: opacity.pressed, transform: [{ scale: 0.985 }] },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...typography.text.subheading, fontSize: typography.fontSize.base, color: colors.text },
  actionHint: { ...typography.text.meta, color: colors.textMuted },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    minHeight: size.touchMin,
    paddingVertical: space.sm,
    borderWidth: stroke.hairline,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    justifyContent: 'center',
  },
  chipHover: { backgroundColor: colors.cardHover },
  chipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  chipPressed: { opacity: opacity.pressed },
  chipText: { ...typography.text.label, color: colors.textSecondary },
  chipTextActive: { color: colors.onAccent },
  chipCount: {
    minWidth: 22,
    paddingHorizontal: space.xs + 2,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
  },
  chipCountActive: { backgroundColor: 'rgba(23,19,15,0.16)' },
  chipCountText: { ...typography.text.caption, color: colors.textSecondary },
  chipCountTextActive: { color: colors.onAccent },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    borderWidth: stroke.hairline,
  },
  badgeText: typography.text.caption,

  // --- Content -----------------------------------------------------------
  statRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  statCard: {
    minWidth: 88,
    flexGrow: 1,
    flexBasis: 0,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    backgroundColor: colors.surfaceSunken,
    gap: space.xxs,
  },
  statValue: { ...typography.text.number, color: colors.text },
  statLabel: { ...typography.text.meta, color: colors.textSecondary },

  visualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 96,
    borderRadius: radius.lg,
    borderWidth: stroke.hairline,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: space.md,
    ...elevation.sm,
  },
  visualCardSplit: { gap: space.sm },
  visualCardHover: { borderColor: colors.borderStrong, transform: [{ translateY: -2 }] },
  visualCardPressed: { opacity: opacity.pressed },
  visualCardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  visualCardRight: { alignItems: 'center', justifyContent: 'center' },
  cardThumb: { width: 72, height: 72, borderRadius: radius.md, overflow: 'hidden' },
  cardThumbImage: { borderRadius: radius.md },
  cardOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(23,19,15,0.12)' },
  cardPictogram: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  cardThumbFallback: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualCardBody: { flex: 1, gap: space.xxs },
  visualCardTitle: { ...typography.text.subheading, color: colors.text },
  // Was `colors.orange` at 3.15:1 against white — below the AA floor.
  visualCardSubtitle: { ...typography.text.meta, color: colors.orangeInk },
  visualCardMeta: { ...typography.text.meta, color: colors.textMuted },
  visualCardBadge: {
    alignSelf: 'flex-start',
    marginTop: space.xxs,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
  },
  visualCardBadgeText: { ...typography.text.caption, color: colors.text },

  metaPill: {
    flex: 1,
    minWidth: 148,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: stroke.hairline,
    borderColor: colors.border,
  },
  metaPillCopy: { flex: 1, gap: space.xxs },
  metaPillLabel: { ...typography.text.caption, color: colors.textMuted },
  metaPillValue: { ...typography.text.label, color: colors.text },

  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill },
  inlineScrollContent: { gap: space.sm, paddingRight: space.sm, paddingVertical: 2 },

  // --- States ------------------------------------------------------------
  skeletonCard: { ...elevation.flat },
  skeletonBody: { flex: 1, gap: space.sm },
  stateCard: {
    minHeight: 200,
    padding: space.xl,
    borderRadius: radius.lg,
    borderWidth: stroke.hairline,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  errorCard: { backgroundColor: colors.errorSurface, borderColor: 'rgba(184,28,35,0.22)' },
  stateTitle: { ...typography.text.subheading, color: colors.text, textAlign: 'center' },
});

/** Re-exported so screens can reference motion timings without a second import. */
export { duration as motionDuration };
