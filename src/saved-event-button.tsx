import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './theme/colors';
import { typography } from './theme/typography';
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
    borderRadius: 999,
    borderWidth: 1,
  },
  regular: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compact: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    fontSize: typography.fontSize.xs,
  },
  labelSaved: {
    color: colors.black,
  },
  labelUnsaved: {
    color: colors.orangeInk,
  },
});
