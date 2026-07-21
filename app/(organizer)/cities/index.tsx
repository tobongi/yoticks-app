import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors } from '../../../src/theme/colors';
import { organizerColors } from '../../../src/theme/organizer';
import { shadow } from '../../../src/theme/shadows';
import { typography } from '../../../src/theme/typography';
import { FALLBACK_EVENTS, listOrganizerEvents, type BackendEvent } from '../../../src/backend';
import { groupEventsByCity, type CityGroup } from '../../../src/cities';
import { ArrowLeftIcon, CalendarIcon, ChevronRightIcon, MapIcon } from '../../../src/icons';
import { useAuth } from '../../../src/auth';
import { Pictogram } from '../../../src/ui/pictograms';
import { Screen } from '../../../src/ui/screen';

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
  }, [token, user]);

  const cityGroups = useMemo<CityGroup[]>(() => groupEventsByCity(events), [events]);
  const totalEvents = events.length;
  const liveCities = cityGroups.length;
  const topCity = cityGroups[0];
  const totalPaidEvents = events.filter((event) => event.price !== 'Gratuit').length;

  return (
    <Screen bleed>
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
          <Text style={styles.kicker}>Villes</Text>
          <Text style={styles.title}>Où sont les billets ?</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroPill}>
          <Pictogram pictogram="map" tone="yellow" size={52} />
          <Text style={styles.heroPillText}>CARTE EN DIRECT</Text>
        </View>

        <View style={styles.metricRow}>
          <Metric label="Villes" value={String(liveCities)} />
          <Metric label="Sorties" value={String(totalEvents)} />
          <Metric label="Payants" value={String(totalPaidEvents)} />
        </View>
      </View>

      <View style={styles.highlightCard}>
        <View style={styles.highlightHeader}>
          <View style={styles.highlightIcon}>
            <MapIcon size={16} color={colors.orangeInk} />
          </View>
          <View style={styles.highlightCopy}>
            <Text style={styles.highlightLabel}>Ville forte</Text>
            <Text style={styles.highlightTitle}>{topCity?.label ?? 'Aucune ville'}</Text>
          </View>
        </View>
        <Text style={styles.highlightMeta}>
          {topCity ? `${topCity.count} live event${topCity.count === 1 ? '' : 's'} in this city` : 'Add events to start building a city map.'}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Toutes les villes</Text>
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
              <CalendarIcon size={14} color={colors.orangeInk} />
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
    </Screen>
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
    color: colors.orangeInk,
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
    color: colors.orangeInk,
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
    color: colors.orangeInk,
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
