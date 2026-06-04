import { ScrollView, View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'concerts', label: '🎵 Concerts' },
  { id: 'conferences', label: '🎤 Conférences' },
  { id: 'soirees', label: '🌙 Soirées' },
  { id: 'festivals', label: '🎪 Festivals' },
  { id: 'sport', label: '⚽ Sport' },
];

const FEATURED_EVENTS = [
  { id: '1', title: 'Kinshasa Jazz Festival', date: '15 Juin 2026', location: 'Kinshasa, RDC', category: 'Concerts', price: '5 000 FC', color: colors.orange },
  { id: '2', title: 'Africa CEO Forum', date: '22 Juin 2026', location: 'Abidjan, CI', category: 'Conférences', price: '25 000 FC', color: colors.red },
  { id: '3', title: 'Nuit Électro Dakar', date: '28 Juin 2026', location: 'Dakar, SN', category: 'Soirées', price: '3 000 FC', color: colors.green },
];

const UPCOMING_EVENTS = [
  { id: '4', title: 'Tournoi de Football Communautaire', date: '5 Juil 2026', location: 'Kinshasa', price: 'Gratuit' },
  { id: '5', title: 'Salon de la Mode Africaine', date: '12 Juil 2026', location: 'Douala', price: '8 000 FC' },
  { id: '6', title: 'Concert Gospel Gratitude', date: '19 Juil 2026', location: 'Libreville', price: '2 500 FC' },
  { id: '7', title: 'Forum Jeunesse & Innovation', date: '26 Juil 2026', location: 'Nairobi', price: 'Gratuit' },
];

export default function Home() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.tagline}>Que vas-tu vivre aujourd'hui ?</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un event, une ville..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={styles.categoriesContent}>
          {CATEGORIES.map((cat) => (
            <Pressable key={cat.id} style={[styles.chip, cat.id === 'all' && styles.chipActive]}>
              <Text style={[styles.chipText, cat.id === 'all' && styles.chipTextActive]}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Featured */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À la une</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {FEATURED_EVENTS.map((event) => (
              <Pressable key={event.id} style={[styles.featuredCard, { borderTopColor: event.color }]} onPress={() => router.push(`/event/${event.id}`)}>
                <View style={[styles.featuredBadge, { backgroundColor: event.color + '22' }]}>
                  <Text style={[styles.featuredBadgeText, { color: event.color }]}>{event.category}</Text>
                </View>
                <Text style={styles.featuredTitle}>{event.title}</Text>
                <Text style={styles.featuredDate}>📅 {event.date}</Text>
                <Text style={styles.featuredLocation}>📍 {event.location}</Text>
                <View style={styles.featuredFooter}>
                  <Text style={styles.featuredPrice}>{event.price}</Text>
                  <Text style={styles.featuredCta}>Voir →</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prochainement</Text>
          <View style={styles.upcomingList}>
            {UPCOMING_EVENTS.map((event) => (
              <Pressable key={event.id} style={styles.upcomingCard} onPress={() => router.push(`/event/${event.id}`)}>
                <View style={styles.upcomingDateBox}>
                  <Text style={styles.upcomingDateDay}>{event.date.split(' ')[0]}</Text>
                  <Text style={styles.upcomingDateMonth}>{event.date.split(' ')[1]}</Text>
                </View>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingTitle}>{event.title}</Text>
                  <Text style={styles.upcomingLocation}>📍 {event.location}</Text>
                </View>
                <Text style={styles.upcomingPrice}>{event.price}</Text>
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
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 20 },
  greeting: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  tagline: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text, marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.black },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20, gap: 10 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.text },
  categories: { marginBottom: 28 },
  categoriesContent: { gap: 8, paddingRight: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  chipText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  chipTextActive: { color: colors.black },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text, marginBottom: 16 },
  featuredList: { gap: 16, paddingRight: 20 },
  featuredCard: { width: 220, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderTopWidth: 3, borderTopColor: colors.orange, gap: 8 },
  featuredBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  featuredBadgeText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs },
  featuredTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base, color: colors.text, lineHeight: 22 },
  featuredDate: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textSecondary },
  featuredLocation: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textSecondary },
  featuredFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  featuredPrice: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base, color: colors.orange },
  featuredCta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  upcomingList: { gap: 12 },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 14, gap: 14, borderWidth: 1, borderColor: colors.border },
  upcomingDateBox: { width: 44, alignItems: 'center', backgroundColor: colors.cardHover, borderRadius: 8, padding: 8 },
  upcomingDateDay: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.orange, lineHeight: 26 },
  upcomingDateMonth: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted },
  upcomingInfo: { flex: 1, gap: 4 },
  upcomingTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  upcomingLocation: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textSecondary },
  upcomingPrice: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.yellow },
});
