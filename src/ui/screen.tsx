import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { elevation } from '../theme/shadows';
import { radius, space } from '../theme/tokens';
import { useLayout } from './responsive';

/**
 * The app shell every screen sits in.
 *
 * Its single most important job: hold content in a centred column with a
 * real `maxWidth`. Without it the web build stretched a phone layout across
 * the entire browser — a 1440px-wide primary button anchored at x=0.
 *
 * It also standardises the things 30-odd screens were each re-deriving:
 * the canvas colour, safe-area insets, horizontal padding, the gap rhythm
 * between sections, and the bottom inset that keeps the last card clear of
 * the floating tab bar.
 */
export function Screen({
  children,
  scroll = true,
  footer,
  wide = false,
  padded = true,
  gap,
  bleed = false,
  contentStyle,
  testID,
}: {
  children: ReactNode;
  /** Set false for screens that manage their own scrolling (camera, lists). */
  scroll?: boolean;
  /** Sticky action bar pinned to the bottom, inside the centred column. */
  footer?: ReactNode;
  /** Use the wider organiser column instead of the reading column. */
  wide?: boolean;
  /** Set false to run content edge to edge (full-bleed media). */
  padded?: boolean;
  /** Override the vertical rhythm between children. */
  gap?: number;
  /** Reserve no bottom inset — for screens without a tab bar. */
  bleed?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const layout = useLayout();
  const maxWidth = wide ? layout.wideMaxWidth : layout.contentMaxWidth;
  const horizontalPadding = padded ? layout.screenPadding : 0;

  // Clear the floating tab bar plus its bottom offset, and leave a little
  // air so the final card never looks clipped.
  const bottomInset = bleed ? space.xl : layout.isCompact ? 104 : 116;

  const column: StyleProp<ViewStyle> = [
    styles.column,
    {
      maxWidth,
      paddingHorizontal: horizontalPadding,
      gap: gap ?? layout.sectionGap,
    },
    contentStyle,
  ];

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={column}>{children}</View>
        </ScrollView>
      ) : (
        <View style={styles.staticContent}>
          <View style={[column, styles.staticColumn]}>{children}</View>
        </View>
      )}

      {footer ? (
        <View style={styles.footerLayer} pointerEvents="box-none">
          <View
            style={[
              styles.footer,
              {
                maxWidth,
                marginHorizontal: horizontalPadding,
              },
            ]}
          >
            {footer}
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * A centred column outside of `Screen` — for screens that need their own
 * scroll container (the scanner, the checkout poller) but still must not
 * stretch across a desktop browser.
 */
export function CenteredColumn({
  children,
  wide = false,
  style,
}: {
  children: ReactNode;
  wide?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const layout = useLayout();
  return (
    <View
      style={[
        styles.column,
        { maxWidth: wide ? layout.wideMaxWidth : layout.contentMaxWidth },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    // Centres the column on wide viewports and keeps it flush on phones.
    alignItems: 'center',
    paddingTop: space.md,
  },
  staticContent: {
    flex: 1,
    alignItems: 'center',
  },
  staticColumn: {
    flex: 1,
  },
  column: {
    width: '100%',
    // `alignSelf` centres the column when its parent is a plain flex column
    // (onboarding's fixed header and footer); the ScrollView above also sets
    // `alignItems: 'center'` for the scrolling case. Both are needed —
    // neither one alone covers both parents.
    alignSelf: 'center',
  },
  footerLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: space.md,
  },
  footer: {
    width: '100%',
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    ...elevation.lg,
  },
});
