import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { organizerColors } from '../../src/theme/organizer';
import { typography } from '../../src/theme/typography';
import { LivedBackground } from '../../src/ui/lived-in';
import { Pictogram, TicketStubArt } from '../../src/ui/pictograms';

export default function OrganizerBrandKit() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>MON IMAGE</Text>
        <Text style={styles.title}>YoTicks Organizer</Text>
        <View style={styles.artRow}><Pictogram pictogram="art" size={94} /><TicketStubArt tone="blue" size={120} /></View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>COULEURS</Text>
          <View style={styles.swatches}><View style={[styles.swatch, { backgroundColor: colors.orange }]} /><View style={[styles.swatch, { backgroundColor: colors.yellow }]} /><View style={[styles.swatch, { backgroundColor: colors.green }]} /><View style={[styles.swatch, { backgroundColor: colors.blue }]} /></View>
          <Text style={styles.cardValue}>Chaud • vivant • facile à voir</Text>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: organizerColors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, gap: 14 },
  kicker: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
  },
  title: { fontFamily: typography.fontFamily.bold, fontSize: 28, lineHeight: 34, color: organizerColors.text },
  copy: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, lineHeight: 22, color: organizerColors.textSecondary },
  artRow: { minHeight: 150, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderRadius: 28, backgroundColor: organizerColors.surface, borderWidth: 1, borderColor: organizerColors.border },
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
  swatches: { flexDirection: 'row', gap: 10 },
  swatch: { flex: 1, height: 58, borderRadius: 18 },
  backButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: organizerColors.accentSoft,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
  },
  backText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orange },
});
