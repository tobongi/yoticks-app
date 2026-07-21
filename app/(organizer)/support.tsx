import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { organizerColors } from '../../src/theme/organizer';
import { typography } from '../../src/theme/typography';
import { PrimaryAction } from '../../src/ui/lived-in';
import { Pictogram } from '../../src/ui/pictograms';
import { Screen } from '../../src/ui/screen';

const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@yoticks.app';

export default function OrganizerSupport() {
  return (
    <Screen bleed>
      <Text style={styles.kicker}>AIDE</Text>
      <Text style={styles.title}>Un problème ?</Text>
      <View style={styles.helpArt}><Pictogram pictogram="help" tone="blue" size={126} /></View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>SUPPORT YOTICKS</Text>
        <Text style={styles.cardValue}>{supportEmail}</Text>
        <PrimaryAction label="Écrire au support" pictogram="talk" tone="blue" onPress={() => void Linking.openURL(`mailto:${supportEmail}?subject=Support%20organisateur%20YoTicks`)} />
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Retour</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
  },
  title: { fontFamily: typography.fontFamily.bold, fontSize: 28, lineHeight: 34, color: organizerColors.text },
  copy: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, lineHeight: 22, color: organizerColors.textSecondary },
  helpArt: { minHeight: 180, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: organizerColors.surface, borderWidth: 1, borderColor: organizerColors.border },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.border,
    gap: 6,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  cardValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: organizerColors.text },
  backButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: organizerColors.accentSoft,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
  },
  backText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orangeInk },
});
