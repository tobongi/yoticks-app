import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { organizerColors } from '../../../src/theme/organizer';
import { shadow } from '../../../src/theme/shadows';
import { typography } from '../../../src/theme/typography';
import { FALLBACK_EVENTS, listOrganizerEvents, type BackendEvent } from '../../../src/backend';
import { groupEventsByCity, type CityGroup } from '../../../src/cities';
import { ArrowLeftIcon, CalendarIcon, ChevronRightIcon, MapIcon, SparkIcon } from '../../../src/icons';
import { useAuth } from '../../../src/auth';

export default function OrganizerCities() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<BackendEvent[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fallbackEvents = FALLBACK_EVENTS.filter((event) => event.organizerId === user.id);
    setEvents(fallbackEvents);
    listOrganizerEvents(token ?? undefined, user.id).then(setEvents);
  }, [token, user?.id]);

  const cityGroups = useMemo<CityGroup[]>(() => groupEventsByCity(events), [events]);
  const totalEvents = events.length;
  const liveCities = cityGroups.length;
  const topCity = cityGroups[0];
  const totalPaidEvents = events.filter((event) => event.price !== 'Gratuit').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to organizer dashboard"
            onPress={() => {
              if (typeof router.canGoBack === 'function' && router.canGoBack()) {
                router.back();
                return;
              }
              router.replace('/(organizer)' as never);
            }}
          >
            <ArrowLeftIcon size={16} color={organizerColors.text} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.kicker}>City drill-down</Text>
            <Text style={styles.title}>Cities that are actually moving tickets.</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroPill}>
            <SparkIcon size={12} color={colors.orange} />
            <Text style={styles.heroPillText}>Live city view</Text>
          </View>
          <Text style={styles.heroCopy}>
            Track where the organizer catalog is landing, which cities are carrying the most events, and where the next push should go.
          </Text>

          <View style={styles.metricRow}>
            <Metric label="Villes" value={String(liveCities)} />
            <Metric label="Events" value={String(totalEvents)} />
            <Metric label="Payants" value={String(totalPaidEvents)} />
          </View>
        </View>

        <View style={styles.highlightCard}>
          <View style={styles.highlightHeader}>
            <View style={styles.highlightIcon}>
              <MapIcon size={16} color={colors.orange} />
            </View>
            <View style={styles.highlightCopy}>
              <Text style={styles.highlightLabel}>Top city</Text>
              <Text style={styles.highlightTitle}>{topCity?.label ?? 'No cities yet'}</Text>
            </View>
          </View>
          <Text style={styles.highlightMeta}>
            {topCity ? `${topCity.count} live event${topCity.count === 1 ? '' : 's'} in this city` : 'Add events to start building a city map.'}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>City ledger</Text>
          <Text style={styles.sectionCaption}>Each row reflects one live destination in the organizer catalog.</Text>
        </View>

        <View style={styles.list}>
          {cityGroups.map((group) => (
            <Link
              key={group.key}
              href={`/(organizer)/cities/${group.key}` as never}
              accessibilityRole="button"
              accessibilityLabel={`Open ${group.label} city details`}
              style={styles.cityCard}
            >
              <View style={styles.cityIcon}>
                <CalendarIcon size={14} color={colors.orange} />
              </View>
              <View style={styles.cityBody}>
                <View style={styles.cityHeader}>
                  <Text style={styles.cityName}>{group.label}</Text>
                  <Text style={styles.cityCount}>{group.count} live</Text>
                </View>
                <Text style={styles.cityMeta}>{group.events.map((event) => event.category).join(' · ')}</Text>
                <Text style={styles.cityEvent}>{group.events[0]?.title}</Text>
              </View>
              <ChevronRightIcon size={16} color={organizerColors.textMuted} />
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: organizerColors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: organizerColors.border,
    backgroundColor: organizerColors.surface,
  },
  topCopy: { flex: 1, gap: 6 },
  kicker: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    color: organizerColors.text,
  },
  heroCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.border,
    ...shadow({ color: '#000', opacity: 0.06, radius: 18, offset: { width: 0, height: 8 }, elevation: 3 }),
    gap: 12,
  },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: organizerColors.warningSoft,
  },
  heroPillText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heroCopy: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: 23,
    color: organizerColors.textSecondary,
  },
  metricRow: { flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    backgroundColor: organizerColors.surfaceAlt,
    borderWidth: 1,
    borderColor: organizerColors.border,
    gap: 4,
  },
  metricValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: organizerColors.text,
  },
  metricLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  highlightCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: organizerColors.surfaceAlt,
    borderWidth: 1,
    borderColor: organizerColors.border,
    gap: 10,
  },
  highlightHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: organizerColors.warningSoft,
  },
  highlightCopy: { flex: 1, gap: 2 },
  highlightLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  highlightTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: organizerColors.text,
  },
  highlightMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: organizerColors.textSecondary,
  },
  sectionHeader: { gap: 4, marginTop: 2 },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: organizerColors.text,
  },
  sectionCaption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: organizerColors.textSecondary,
    lineHeight: 20,
  },
  list: { gap: 10 },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  cityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: organizerColors.warningSoft,
  },
  cityBody: { flex: 1, gap: 4 },
  cityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cityName: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: organizerColors.text,
  },
  cityCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  cityMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textMuted,
  },
  cityEvent: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: organizerColors.textSecondary,
  },
});
