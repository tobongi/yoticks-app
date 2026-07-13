import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { organizerColors } from '../../src/theme/organizer';
import { typography } from '../../src/theme/typography';

export default function OrganizerBrandKit() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Brand kit</Text>
        <Text style={styles.title}>Your organizer identity, color, and event voice.</Text>
        <Text style={styles.copy}>
          This page is where the organizer brand setup will live: logo, colors, copy tone, and assets for event pages.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Coming from</Text>
          <Text style={styles.cardValue}>YoTicks organizer</Text>
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back to profile</Text>
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
  backText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orange },
});
