import type { ReactNode } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { shadow } from '../theme/shadows';
import { typography } from '../theme/typography';
import { Pictogram } from './pictograms';
import { getCategoryVisual, type PictogramKey, type VisualTone } from './visual-language';

type Tone = VisualTone;

const toneMap: Record<Tone, { tint: string; border: string; ink: string; soft: string }> = {
  orange: { tint: colors.orange, border: colors.borderOrange, ink: colors.orange, soft: colors.accentWash },
  green: { tint: colors.green, border: colors.green + '33', ink: colors.green, soft: colors.green + '14' },
  yellow: { tint: colors.yellow, border: colors.yellow + '55', ink: colors.black, soft: colors.yellow + '18' },
  blue: { tint: colors.blue, border: colors.blue + '44', ink: colors.blue, soft: colors.surfaceBlue },
  red: { tint: colors.red, border: colors.red + '44', ink: colors.red, soft: '#FFF0F0' },
  ink: { tint: colors.black, border: colors.borderStrong, ink: colors.black, soft: colors.cardHover },
};

export function LivedBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.backgroundFrame, { pointerEvents: 'none' }]}>
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />
      <View style={styles.grid} />
    </View>
  );
}

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
      <View style={[styles.heroGlow, { backgroundColor: palette.soft }]} />
      <View style={styles.heroTop}>
        <View style={styles.heroCopy}>
          {eyebrow ? (
            <View style={[styles.heroEyebrow, { backgroundColor: palette.soft, borderColor: palette.border }]}>
              <Text style={[styles.heroEyebrowText, { color: palette.ink }]}>{eyebrow}</Text>
            </View>
          ) : null}
          <Text style={styles.heroTitle}>{title}</Text>
          {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
        </View>
        {art ? <View style={styles.heroArt}>{art}</View> : null}
      </View>
      {children}
    </View>
  );
}

export function StatRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={styles.statRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.statCard}>
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={hint}
      style={[styles.actionTile, { backgroundColor: palette.soft, borderColor: palette.border }, style]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: colors.bg }]}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
      {hint ? <Text style={styles.actionHint}>{hint}</Text> : null}
    </Pressable>
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
        <View>
          {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Chip({
  label,
  active = false,
  onPress,
  accessibilityLabel,
  pictogram,
  tone = 'orange',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  pictogram?: PictogramKey;
  tone?: Tone;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      {pictogram ? <Pictogram pictogram={pictogram} tone={tone} size={30} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
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
  const content = (
    <>
      {imageUrl ? (
        <ImageBackground source={{ uri: imageUrl }} style={styles.cardThumb} imageStyle={styles.cardThumbImage}>
          <View style={styles.cardOverlay} />
          <View style={styles.cardPictogram}>
            <Pictogram pictogram={visual.key} tone={visual.tone} size={32} />
          </View>
          {badge ? (
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{badge}</Text>
            </View>
          ) : null}
        </ImageBackground>
      ) : (
        <View style={styles.cardThumbFallback}>
          <Pictogram pictogram={visual.key} tone={visual.tone} size={50} />
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
      </View>
    </>
  );

  if (right) {
    return (
      <View style={styles.visualCard}>
        {onPress ? (
          <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} style={styles.visualCardMain} onPress={onPress}>
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
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} style={styles.visualCard} onPress={onPress}>
      {content}
    </Pressable>
  );
}

export function PrimaryAction({
  label,
  pictogram,
  onPress,
  tone = 'orange',
  disabled = false,
  accessibilityHint,
}: {
  label: string;
  pictogram: PictogramKey;
  onPress?: () => void;
  tone?: Tone;
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  const palette = toneMap[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryAction,
        { backgroundColor: palette.tint, borderColor: palette.ink },
        pressed && !disabled && styles.primaryActionPressed,
        disabled && styles.primaryActionDisabled,
      ]}
    >
      <View style={styles.primaryActionIcon}>
        <Pictogram pictogram={pictogram} tone={tone} size={46} />
      </View>
      <Text style={[styles.primaryActionText, { color: tone === 'ink' ? colors.ivory : colors.black }]}>{label}</Text>
    </Pressable>
  );
}

export function MetaPill({ pictogram, tone = 'ink', label, value }: { pictogram: PictogramKey; tone?: Tone; label: string; value: string }) {
  return (
    <View style={styles.metaPill} accessibilityLabel={`${label}: ${value}`}>
      <Pictogram pictogram={pictogram} tone={tone} size={38} />
      <View style={styles.metaPillCopy}>
        <Text style={styles.metaPillLabel}>{label}</Text>
        <Text style={styles.metaPillValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

export function ProgressBar({ value, total, tone = 'orange' }: { value: number; total: number; tone?: Tone }) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${ratio * 100}%`, backgroundColor: toneMap[tone].tint }]} />
    </View>
  );
}

export function InlineScroll({ children, contentContainerStyle }: { children: ReactNode; contentContainerStyle?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.inlineScrollContent, contentContainerStyle]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backgroundFrame: {
    overflow: 'hidden',
  },
  orbTop: {
    position: 'absolute',
    top: -110,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(242,100,59,0.12)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: 80,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: 'rgba(246,195,91,0.15)',
  },
  grid: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderTopWidth: 1,
    borderColor: 'rgba(17,17,17,0.03)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1, gap: 6 },
  eyebrow: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  headerTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['3xl'], lineHeight: 40, color: colors.text },
  heroPanel: {
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 20,
    gap: 16,
    ...shadow({ color: '#000', opacity: 0.12, radius: 24, offset: { width: 0, height: 10 }, elevation: 8 }),
  },
  heroGlow: { position: 'absolute', right: -28, top: -18, width: 160, height: 160, borderRadius: 160 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  heroCopy: { flex: 1, gap: 10 },
  heroEyebrow: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  heroEyebrowText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.xs, letterSpacing: 1.3, textTransform: 'uppercase' },
  heroTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], lineHeight: 34, color: colors.text },
  heroSubtitle: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary },
  heroArt: { minWidth: 72, alignItems: 'center', justifyContent: 'center' },
  statRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statCard: {
    minWidth: 90,
    flexGrow: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 3,
  },
  statValue: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text },
  statLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  actionTile: {
    minWidth: 108,
    minHeight: 128,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  actionIcon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base, color: colors.text },
  actionHint: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted },
  section: { gap: 14 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  sectionEyebrow: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  sectionTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 48,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  chipText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  chipTextActive: { color: colors.black },
  visualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 96,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 10,
  },
  visualCardMain: {
    flex: 1,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visualCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardThumb: { width: 78, height: 78, borderRadius: 20, overflow: 'hidden', justifyContent: 'space-between' },
  cardThumbImage: { borderRadius: 20 },
  cardOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(17,17,17,0.18)' },
  cardBadge: { alignSelf: 'flex-start', margin: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.88)' },
  cardBadgeText: { fontFamily: typography.fontFamily.semiBold, fontSize: 10, color: colors.text },
  cardPictogram: { position: 'absolute', right: 6, bottom: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.88)' },
  cardThumbFallback: { width: 78, height: 78, borderRadius: 20, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  visualCardBody: { flex: 1, gap: 4 },
  visualCardTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  visualCardSubtitle: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.orange },
  visualCardMeta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: colors.cardHover, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  inlineScrollContent: { gap: 8, paddingRight: 8 },
  primaryAction: {
    minHeight: 64,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...shadow({ color: '#000', opacity: 0.14, radius: 16, offset: { width: 0, height: 8 }, elevation: 6 }),
  },
  primaryActionPressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
  primaryActionDisabled: { opacity: 0.48 },
  primaryActionIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.78)', alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg },
  metaPill: { flex: 1, minWidth: 142, minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderRadius: 20, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.border },
  metaPillCopy: { flex: 1, gap: 1 },
  metaPillLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted },
  metaPillValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
});
