import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const CITIES = [
  { id: 'kin', label: 'Kinshasa', emoji: '🇨🇩', count: 42 },
  { id: 'abj', label: 'Abidjan', emoji: '🇨🇮', count: 28 },
  { id: 'dkr', label: 'Dakar', emoji: '🇸🇳', count: 21 },
  { id: 'dla', label: 'Douala', emoji: '🇨🇲', count: 15 },
  { id: 'lbv', label: 'Libreville', emoji: '🇬🇦', count: 12 },
  { id: 'nbi', label: 'Nairobi', emoji: '🇰🇪', count: 34 },
];

const TRENDING = [
  { id: 't1', query: 'Jazz Festival' },
  { id: 't2', query: 'Forum Africa CEO' },
  { id: 't3', query: 'Concert Gospel' },
  { id: 't4', query: 'Soirée Électro' },
  { id: 't5', query: 'Match Football' },
];

export default function Search() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Recherche</Text>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Event, artiste, ville..."
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tendances</Text>
          <View style={styles.trendingList}>
            {TRENDING.map((t) => (
              <Pressable key={t.id} style={styles.trendingItem}>
                <Text style={styles.trendingIcon}>🔥</Text>
                <Text style={styles.trendingText}>{t.query}</Text>
                <Text style={styles.trendingArrow}>→</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explorer par ville</Text>
          <View style={styles.citiesGrid}>
            {CITIES.map((city) => (
              <Pressable key={city.id} style={styles.cityCard}>
                <Text style={styles.cityEmoji}>{city.emoji}</Text>
                <Text style={styles.cityName}>{city.label}</Text>
                <Text style={styles.cityCount}>{city.count} events</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  pageTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], color: colors.text, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 28, gap: 10 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.text },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text, marginBottom: 16 },
  trendingList: { gap: 8 },
  trendingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 12 },
  trendingIcon: { fontSize: 18 },
  trendingText: { flex: 1, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.text },
  trendingArrow: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textMuted },
  citiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cityCard: { width: '47%', backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 4 },
  cityEmoji: { fontSize: 28, marginBottom: 4 },
  cityName: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  cityCount: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textMuted },
});
