import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './theme/colors';
import { typography } from './theme/typography';
import { radius, size, space } from './theme/tokens';
import { useI18n } from './i18n';
import { useSavedEvents } from './saved-events';

type SavedEventButtonProps = {
  compact?: boolean;
  eventId: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SavedEventButton({ compact = false, eventId, fullWidth = false, style }: SavedEventButtonProps) {
  const { t } = useI18n();
  const { isSaved, pendingIds, toggleSavedEvent } = useSavedEvents();
  const saved = isSaved(eventId);
  const pending = pendingIds.includes(eventId);

  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation?.();
    void toggleSavedEvent(eventId);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: pending, selected: saved }}
      disabled={pending}
      onPress={handlePress}
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        fullWidth && styles.fullWidth,
        saved ? styles.saved : styles.unsaved,
        pending && styles.pending,
        style,
      ]}
    >
      <Text style={[styles.label, compact ? styles.labelCompact : styles.labelRegular, saved ? styles.labelSaved : styles.labelUnsaved]}>
        {saved ? t('saved.saved') : t('saved.save')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  regular: {
    minHeight: size.touchMin,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  // The compact variant used to be 34pt tall, below the WCAG 2.2 minimum —
  // measured at 88x34 on the live site. It sits at the edge of a card that
  // is itself tappable, so an undersized target here means people who miss
  // it open the event instead of saving it.
  compact: {
    minHeight: size.touchMin,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  fullWidth: {
    width: '100%',
  },
  saved: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  unsaved: {
    backgroundColor: colors.card,
    borderColor: colors.borderOrange,
  },
  pending: {
    opacity: 0.7,
  },
  label: {
    fontFamily: typography.fontFamily.semiBold,
  },
  labelRegular: {
    fontSize: typography.fontSize.sm,
  },
  labelCompact: {
    fontSize: typography.fontSize.sm,
  },
  labelSaved: {
    color: colors.black,
  },
  labelUnsaved: {
    color: colors.orangeInk,
  },
});
