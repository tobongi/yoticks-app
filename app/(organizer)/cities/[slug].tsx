import { useEffect, useMemo, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../src/theme/colors';
import { organizerColors } from '../../../src/theme/organizer';
import { shadow } from '../../../src/theme/shadows';
import { typography } from '../../../src/theme/typography';
import { FALLBACK_EVENTS, listOrganizerEvents, type BackendEvent } from '../../../src/backend';
import { groupEventsByCity } from '../../../src/cities';
import { ArrowLeftIcon, CalendarIcon, ChevronRightIcon, MapIcon } from '../../../src/icons';
import { useAuth } from '../../../src/auth';
import { Pictogram } from '../../../src/ui/pictograms';
import { Screen } from '../../../src/ui/screen';

export default function OrganizerCityDetail() {
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
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

  const cityKey = Array.isArray(slug) ? slug[0] ?? '' : slug ?? '';
  const cityGroup = useMemo(() => groupEventsByCity(events).find((group) => group.key === cityKey), [cityKey, events]);
  const cityEvents = cityGroup?.events ?? [];

  return (
    <Screen bleed>
      <View style={styles.topRow}>
        <Pressable
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to city list"
          onPress={() => {
            if (typeof router.canGoBack === 'function' && router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/(organizer)/cities' as never);
          }}
        >
          <ArrowLeftIcon size={16} color={organizerColors.text} />
        </Pressable>
        <View style={styles.topCopy}>
          <Text style={styles.kicker}>Ville</Text>
          <Text style={styles.title}>{cityGroup?.label ?? 'Ville inconnue'}</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroPill}>
          <Pictogram pictogram="map" tone="yellow" size={52} />
          <Text style={styles.heroPillText}>EN DIRECT</Text>
        </View>
        <Text style={styles.heroCopy}>
          {cityGroup
            ? 'Événements dans cette ville.'
            : 'Cette ville n’est pas disponible.'}
        </Text>

        <View style={styles.metricRow}>
          <Metric label="Villes" value={String(groupEventsByCity(events).length)} />
          <Metric label="Sorties" value={String(cityEvents.length)} />
          <Metric label="Payants" value={String(cityEvents.filter((event) => event.price !== 'Gratuit').length)} />
        </View>
      </View>

      {cityGroup ? (
        <>
          <View style={styles.highlightCard}>
            <View style={styles.highlightHeader}>
              <View style={styles.highlightIcon}>
                <MapIcon size={16} color={colors.orangeInk} />
              </View>
              <View style={styles.highlightCopy}>
                <Text style={styles.highlightLabel}>Ville</Text>
                <Text style={styles.highlightTitle}>{cityGroup.label}</Text>
              </View>
            </View>
            <Text style={styles.highlightMeta}>
              {cityGroup.count} live event{cityGroup.count === 1 ? '' : 's'} in this city
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Événements</Text>
          </View>

          <View style={styles.list}>
            {cityEvents.map((event) => (
              <Pressable
                key={event.id}
                style={styles.eventCard}
                accessibilityRole="button"
                accessibilityLabel={`Open ${event.title}`}
                onPress={() => router.push(`/(organizer)/events/${event.id}` as never)}
              >
                <ImageBackground source={{ uri: event.imageUrl }} style={styles.eventThumb} imageStyle={styles.eventThumbInner}>
                  <View style={styles.eventThumbOverlay} />
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeText}>{event.category}</Text>
                  </View>
                </ImageBackground>
                <View style={styles.eventBody}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventMeta}>
                    {event.date} · {event.location}
                  </Text>
                  <Text style={styles.eventPrice}>{event.price}</Text>
                </View>
                <ChevronRightIcon size={16} color={organizerColors.textMuted} />
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <CalendarIcon size={18} color={colors.orangeInk} />
          <Text style={styles.emptyTitle}>No matching city yet</Text>
          <Text style={styles.emptyCopy}>Go back to the city list and pick one of the live locations in this organizer account.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Voir les villes" style={styles.emptyAction} onPress={() => router.replace('/(organizer)/cities' as never)}>
            <Text style={styles.emptyActionText}>Back to cities</Text>
          </Pressable>
        </View>
      )}
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
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  eventThumb: { width: 70, height: 70, borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end' },
  eventThumbInner: { borderRadius: 18 },
  eventThumbOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20, 14, 10, 0.12)' },
  eventBadge: {
    alignSelf: 'flex-start',
    margin: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  eventBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  eventBody: { flex: 1, gap: 4 },
  eventTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: organizerColors.text,
  },
  eventMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textMuted,
  },
  eventPrice: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: organizerColors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    padding: 22,
    borderRadius: 24,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: organizerColors.text,
  },
  emptyCopy: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: organizerColors.textSecondary,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.orange,
  },
  emptyActionText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.black,
  },
});
