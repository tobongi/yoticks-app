import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const EVENTS: Record<string, any> = {
  '1': { title: 'Kinshasa Jazz Festival', date: '15 Juin 2026 — 19h00', location: 'Stade des Martyrs, Kinshasa, RDC', category: 'Concerts', price: '5 000 FC', description: 'La plus grande célébration de jazz en Afrique centrale. 12 artistes internationaux, 3 scènes, food court africain.', organizer: 'Kinshasa Culture', color: colors.orange },
  '2': { title: 'Africa CEO Forum', date: '22 Juin 2026 — 08h30', location: 'Hôtel Ivoire, Abidjan, CI', category: 'Conférences', price: '25 000 FC', description: 'Le sommet des dirigeants africains. 500+ CEO, panels, networking, pitch startups. Thème 2026 : IA & Souveraineté.', organizer: 'Africa Business+', color: colors.red },
  '3': { title: 'Nuit Électro Dakar', date: '28 Juin 2026 — 22h00', location: 'Club Arc-en-Ciel, Dakar, SN', category: 'Soirées', price: '3 000 FC', description: 'La nuit la plus attendue de la saison. DJs internationaux, son Dolby Atmos, light show immersif.', organizer: 'Dakar Nights', color: colors.green },
};

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = EVENTS[id] ?? EVENTS['1'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { borderBottomColor: event.color }]}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>← Retour</Text>
          </Pressable>
          <View style={[styles.categoryBadge, { backgroundColor: event.color + '22' }]}>
            <Text style={[styles.categoryText, { color: event.color }]}>{event.category}</Text>
          </View>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.organizer}>Par {event.organizer}</Text>
        </View>

        {/* Details */}
        <View style={styles.details}>
          {[
            { icon: '📅', label: 'Date & heure', value: event.date },
            { icon: '📍', label: 'Lieu', value: event.location },
          ].map((d) => (
            <View key={d.label} style={styles.detailRow}>
              <Text style={styles.detailIcon}>{d.icon}</Text>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.cta}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Prix</Text>
          <Text style={styles.price}>{event.price}</Text>
        </View>
        <Pressable style={[styles.buyBtn, { backgroundColor: event.color }]}>
          <Text style={styles.buyBtnText}>Acheter un billet</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, borderBottomWidth: 3, marginBottom: 24, gap: 12 },
  back: { marginBottom: 8 },
  backText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.orange },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 },
  categoryText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs },
  title: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], color: colors.text, lineHeight: 36 },
  organizer: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  details: { paddingHorizontal: 20, gap: 16, marginBottom: 28 },
  detailRow: { flexDirection: 'row', gap: 14, backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
  detailIcon: { fontSize: 22 },
  detailInfo: { gap: 4 },
  detailLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textMuted },
  detailValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  section: { paddingHorizontal: 20, marginBottom: 120 },
  sectionTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text, marginBottom: 12 },
  description: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textSecondary, lineHeight: 26 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32, gap: 16 },
  priceBlock: { gap: 2 },
  priceLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textMuted },
  price: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text },
  buyBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buyBtnText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base, color: colors.black },
});
