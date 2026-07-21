import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { getHomeData, listEvents, type BackendEvent } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { buildHomeDigest } from '../../src/app-redesign';
import { getOnboardingPreferences, saveOnboardingPreferences, type OnboardingPreferences } from '../../src/onboarding-prefs';
import { getCityKey } from '../../src/cities';
import { useLiveRefresh } from '../../src/live-refresh';
import { CalendarIcon, MapIcon } from '../../src/icons';
import { SavedEventButton } from '../../src/saved-event-button';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { radius, space, stroke } from '../../src/theme/tokens';
import { elevation } from '../../src/theme/shadows';
import {
  Chip,
  EmptyState,
  ErrorState,
  SectionBlock,
  ScreenHeader,
  SkeletonCard,
  VisualCard,
} from '../../src/ui/lived-in';
import { Screen } from '../../src/ui/screen';
import { Pictogram } from '../../src/ui/pictograms';
import { getCategoryVisual } from '../../src/ui/visual-language';
import { useLayout } from '../../src/ui/responsive';
import { ImageScrim } from '../../src/ui/image-scrim';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Home.
 *
 * Restructured around one question: "what am I doing tonight?"
 *
 * The previous version answered that fifth. It opened with a generic panel,
 * then three action tiles — two of which ("Trouver", "Mes QR") were exact
 * duplicates of tabs already in the bottom bar, and a third ("Près de moi")
 * that pushed to the same route as the first. Those are gone. Navigation
 * belongs in the nav; the home screen's job is content.
 *
 * What replaces them is a real spotlight: the event itself, with its own
 * photograph, at the top of the first viewport, with one action on it.
 */
export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [featured, setFeatured] = useState<BackendEvent[]>([]);
  const [upcoming, setUpcoming] = useState<BackendEvent[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [prefs, setPrefs] = useState<OnboardingPreferences | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const refreshTick = useLiveRefresh();
  const layout = useLayout();

  useEffect(() => {
    getOnboardingPreferences().then((next) => {
      setPrefs(next);
      setSelectedCity(next?.city ?? null);
      setSelectedCategory(next?.interests[0] ?? 'all');
    });
  }, []);

  const load = useCallback(
    (signal: { cancelled: boolean }) => {
      Promise.all([listEvents(), getHomeData(undefined, selectedCity ?? undefined)])
        .then(([nextEvents, home]) => {
          if (signal.cancelled) {
            return;
          }
          setEvents(nextEvents);
          setFeatured(home.featuredEvents);
          setUpcoming(home.upcomingEvents);
          setState('ready');
        })
        // Previously absent: a failed request left demo data on screen with
        // no indication anything had gone wrong.
        .catch(() => {
          if (!signal.cancelled) {
            setState('error');
          }
        });
    },
    [selectedCity],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load, refreshTick]);

  const retry = useCallback(() => {
    setState('loading');
    load({ cancelled: false });
  }, [load]);

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        const cityMatch = !selectedCity || getCityKey(event.location) === getCityKey(selectedCity);
        const categoryMatch =
          selectedCategory === 'all' || event.category.toLowerCase() === selectedCategory.toLowerCase();
        return cityMatch && categoryMatch;
      }),
    [events, selectedCategory, selectedCity],
  );

  const digest = useMemo(() => buildHomeDigest(filtered, featured, upcoming), [featured, filtered, upcoming]);
  const spotlight = digest.spotlight ?? filtered[0] ?? events[0] ?? null;
  const cityOptions = useMemo(
    () => ['Tout', ...Array.from(new Set(events.map((event) => event.location))).slice(0, 5)],
    [events],
  );
  const categoryOptions = useMemo(
    () => ['all', ...digest.categories.slice(0, 5).map((item) => item.label)],
    [digest.categories],
  );

  const persistPrefs = async (city: string | null, category: string) => {
    const nextPrefs: OnboardingPreferences = {
      interests: category === 'all' ? [] : [category.toLowerCase()],
      city,
      savedAt: new Date().toISOString(),
    };
    setPrefs(nextPrefs);
    await saveOnboardingPreferences({ interests: nextPrefs.interests, city: nextPrefs.city });
  };

  const greeting = user?.name ? `Salut ${user.name.split(' ')[0]}` : 'Salut';

  return (
    <Screen>
      <ScreenHeader
        eyebrow={selectedCity ?? prefs?.city ?? 'Partout'}
        title={greeting}
        side={
          <View style={styles.mark}>
            <Text style={styles.markText}>YT</Text>
          </View>
        }
      />

      {state === 'error' ? (
        <ErrorState title="Pas de connexion" onRetry={retry} />
      ) : state === 'loading' ? (
        <HomeSkeleton />
      ) : spotlight ? (
        <Spotlight event={spotlight} minHeight={layout.heroImageMinHeight} />
      ) : null}

      {state === 'ready' && events.length > 0 ? (
        <>
          <SectionBlock eyebrow="Filtres" title="Choix rapides">
            <View style={styles.chipWrap}>
              {cityOptions.map((city) => {
                const active = (city === 'Tout' && !selectedCity) || city === selectedCity;
                return (
                  <Chip
                    key={city}
                    label={city}
                    active={active}
                    pictogram="map"
                    tone="yellow"
                    onPress={() => {
                      const nextCity = city === 'Tout' ? null : city;
                      setSelectedCity(nextCity);
                      void persistPrefs(nextCity, selectedCategory);
                    }}
                  />
                );
              })}
            </View>
            <View style={styles.chipWrap}>
              {categoryOptions.map((category) => {
                const visual = getCategoryVisual(category === 'all' ? 'Festival' : category);
                return (
                  <Chip
                    key={category}
                    label={category === 'all' ? 'Tout' : visual.label}
                    pictogram={visual.key}
                    tone={visual.tone}
                    active={selectedCategory === category}
                    onPress={() => {
                      setSelectedCategory(category);
                      void persistPrefs(selectedCity, category);
                    }}
                  />
                );
              })}
            </View>
          </SectionBlock>

          <SectionBlock eyebrow="Pour toi" title="À voir">
            <View style={styles.stack}>
              {filtered.length > 0 ? (
                filtered.slice(0, 5).map((event) => (
                  <VisualCard
                    key={event.id}
                    title={event.title}
                    subtitle={event.category}
                    meta={`${event.location} • ${event.date}`}
                    imageUrl={event.imageUrl}
                    badge={event.price}
                    onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
                    right={<SavedEventButton compact eventId={event.id} />}
                  />
                ))
              ) : (
                <EmptyState
                  art={<Pictogram pictogram="search" tone="blue" size={72} />}
                  title="Rien avec ces filtres"
                  action={
                    <Chip
                      label="Tout voir"
                      pictogram="celebrate"
                      onPress={() => {
                        setSelectedCity(null);
                        setSelectedCategory('all');
                        void persistPrefs(null, 'all');
                      }}
                    />
                  }
                />
              )}
            </View>
          </SectionBlock>

          {featured.length > 0 ? (
            <SectionBlock eyebrow="Bientôt" title="Petite sélection">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                {featured.slice(0, 6).map((event) => (
                  <PosterCard
                    key={event.id}
                    event={event}
                    width={layout.featuredPosterWidth}
                    height={layout.featuredPosterHeight}
                  />
                ))}
              </ScrollView>
            </SectionBlock>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

/**
 * The spotlight.
 *
 * The event's own photograph carries the panel. Text sits on a scrim that
 * is contrast-tested against a worst-case white image, and the whole card is
 * one large target rather than a small button inside a bigger card — this is
 * a product used one-handed while walking.
 */
function Spotlight({ event, minHeight }: { event: BackendEvent; minHeight: number }) {
  const visual = getCategoryVisual(event.category);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ce soir : ${event.title}, ${event.location}, ${event.date}. Voir l’événement.`}
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      style={({ pressed }) => [styles.spotlight, pressed && styles.spotlightPressed]}
    >
      <ImageBackground
        source={{ uri: event.imageUrl }}
        style={[styles.spotlightImage, { minHeight }]}
        imageStyle={styles.spotlightImageInner}
      >
        <ImageScrim id="spotlight" />

        <View style={styles.spotlightTop}>
          <View style={styles.spotlightEyebrow}>
            <Text style={styles.spotlightEyebrowText}>Ce soir</Text>
          </View>
          <View style={styles.spotlightPrice}>
            <Text style={styles.spotlightPriceText}>{event.price}</Text>
          </View>
        </View>

        <View style={styles.spotlightBody}>
          <View style={styles.spotlightCategory}>
            <Pictogram pictogram={visual.key} tone={visual.tone} size={28} />
            <Text style={styles.spotlightCategoryText}>{visual.label}</Text>
          </View>

          <Text style={styles.spotlightTitle} numberOfLines={3}>
            {event.title}
          </Text>

          <View style={styles.spotlightMetaRow}>
            <View style={styles.spotlightMeta}>
              <MapIcon size={14} color={colors.onImage} />
              <Text style={styles.spotlightMetaText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
            <View style={styles.spotlightMeta}>
              <CalendarIcon size={14} color={colors.onImage} />
              <Text style={styles.spotlightMetaText} numberOfLines={1}>
                {event.date}
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function PosterCard({ event, width, height }: { event: BackendEvent; width: number; height: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${event.date}`}
      style={({ pressed }) => [{ width }, pressed && styles.spotlightPressed]}
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
    >
      <ImageBackground
        source={{ uri: event.imageUrl }}
        style={[styles.poster, { height }]}
        imageStyle={styles.posterInner}
      >
        <ImageScrim id="poster" />
        <Text style={styles.posterCategory} numberOfLines={1}>
          {event.category}
        </Text>
        <Text style={styles.posterTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.spotlightMeta}>
          <CalendarIcon size={13} color={colors.onImage} />
          <Text style={styles.posterMetaText} numberOfLines={1}>
            {event.date}
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function HomeSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.spotlightSkeleton} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { ...typography.text.caption, color: colors.onDark, letterSpacing: 2 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stack: { gap: space.md },
  rail: { gap: space.md, paddingRight: space.sm, paddingVertical: 2 },

  spotlight: { borderRadius: radius.xxl, overflow: 'hidden', ...elevation.md },
  spotlightPressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  spotlightImage: { justifyContent: 'space-between', padding: space.lg },
  spotlightImageInner: { borderRadius: radius.xxl },
  spotlightTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
  spotlightEyebrow: {
    borderRadius: radius.pill,
    backgroundColor: colors.orange,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
  },
  spotlightEyebrowText: { ...typography.text.eyebrow, color: colors.onAccent },
  spotlightPrice: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
  },
  spotlightPriceText: { ...typography.text.label, color: colors.text },
  spotlightBody: { gap: space.sm },
  spotlightCategory: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  spotlightCategoryText: { ...typography.text.label, color: colors.onImage },
  spotlightTitle: { ...typography.text.display, color: colors.onImage },
  spotlightMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.xxs },
  spotlightMeta: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, flexShrink: 1 },
  spotlightMetaText: { ...typography.text.meta, color: colors.onImage },
  spotlightSkeleton: {
    minHeight: 280,
    borderRadius: radius.xxl,
    backgroundColor: colors.skeleton,
  },

  poster: { borderRadius: radius.xl, overflow: 'hidden', padding: space.md, justifyContent: 'flex-end', gap: space.xs },
  posterInner: { borderRadius: radius.xl },
  posterCategory: { ...typography.text.caption, color: colors.onImage },
  posterTitle: { ...typography.text.heading, color: colors.onImage },
  posterMetaText: { ...typography.text.meta, color: colors.onImage },

  spotlightBorder: { borderWidth: stroke.hairline, borderColor: colors.border },
});
