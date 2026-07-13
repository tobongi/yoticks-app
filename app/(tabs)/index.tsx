import { useEffect, useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FALLBACK_EVENTS, getHomeData, listEvents, type BackendEvent } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { buildHomeDigest } from '../../src/app-redesign';
import { getOnboardingPreferences, saveOnboardingPreferences, type OnboardingPreferences } from '../../src/onboarding-prefs';
import { getCityKey } from '../../src/cities';
import { useLiveRefresh } from '../../src/live-refresh';
import { CalendarIcon, MapIcon, SearchIcon, SparkIcon, TicketIcon } from '../../src/icons';
import { SavedEventButton } from '../../src/saved-event-button';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { ActionTile, Chip, HeroPanel, LivedBackground, ScreenHeader, SectionBlock, StatRow, VisualCard } from '../../src/ui/lived-in';
import { usePhoneLayout } from '../../src/ui/responsive';

export default function Home() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<BackendEvent[]>(FALLBACK_EVENTS);
  const [featured, setFeatured] = useState<BackendEvent[]>(FALLBACK_EVENTS.slice(0, 3));
  const [upcoming, setUpcoming] = useState<BackendEvent[]>(FALLBACK_EVENTS.slice(0, 6));
  const [prefs, setPrefs] = useState<OnboardingPreferences | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const refreshTick = useLiveRefresh(2500);
  const layout = usePhoneLayout();

  useEffect(() => {
    getOnboardingPreferences().then((next) => {
      setPrefs(next);
      setSelectedCity(next?.city ?? null);
      setSelectedCategory(next?.interests[0] ?? 'all');
    });
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([listEvents(), getHomeData(token ?? undefined, selectedCity ?? undefined)]).then(([nextEvents, home]) => {
      if (!active) {
        return;
      }
      setEvents(nextEvents);
      setFeatured(home.featuredEvents);
      setUpcoming(home.upcomingEvents);
    });
    return () => {
      active = false;
    };
  }, [refreshTick, selectedCity, token]);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const cityMatch = !selectedCity || getCityKey(event.location) === getCityKey(selectedCity);
      const categoryMatch = selectedCategory === 'all' || event.category.toLowerCase() === selectedCategory.toLowerCase();
      return cityMatch && categoryMatch;
    });
  }, [events, selectedCategory, selectedCity]);

  const digest = useMemo(() => buildHomeDigest(filtered, featured, upcoming), [featured, filtered, upcoming]);
  const spotlight = digest.spotlight ?? filtered[0] ?? events[0];
  const cityOptions = useMemo(() => ['Tout', ...Array.from(new Set(events.map((event) => event.location))).slice(0, 5)], [events]);
  const categoryOptions = useMemo(() => ['all', ...digest.categories.slice(0, 5).map((item) => item.label)], [digest.categories]);

  const persistPrefs = async (city: string | null, category: string) => {
    const nextPrefs: OnboardingPreferences = {
      interests: category === 'all' ? [] : [category.toLowerCase()],
      city,
      savedAt: new Date().toISOString(),
    };
    setPrefs(nextPrefs);
    await saveOnboardingPreferences({ interests: nextPrefs.interests, city: nextPrefs.city });
  };

  const title = user?.name ? `Salut ${user.name.split(' ')[0]}` : 'Salut';

  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingHorizontal: layout.screenPadding, paddingBottom: layout.isCompact ? 96 : 110, gap: layout.sectionGap }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow={selectedCity ?? prefs?.city ?? 'Partout'} title={title} side={<View style={styles.mark}><Text style={styles.markText}>YT</Text></View>} />

        <HeroPanel
          eyebrow="Ce soir"
          title={spotlight?.title ?? 'Sortir sans chercher'}
          subtitle={spotlight ? `${spotlight.location} • ${spotlight.date}` : 'Concerts, talks, sport, food'}
          art={<SparkIcon size={38} color={colors.orange} />}
        >
          <StatRow items={digest.stats} />
          <View style={styles.heroActions}>
            <Pressable style={styles.primaryButton} onPress={() => spotlight && router.push({ pathname: '/event/[id]', params: { id: spotlight.id } })}>
              <Text style={styles.primaryButtonText}>Voir</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.secondaryButtonText}>Chercher</Text>
            </Pressable>
          </View>
        </HeroPanel>

        <View style={styles.tileGrid}>
          <ActionTile icon={<SearchIcon size={20} color={colors.orange} />} label="Trouver" hint="Par lieu" style={{ width: layout.tileWidth }} onPress={() => router.push('/(tabs)/search')} />
          <ActionTile icon={<TicketIcon size={20} color={colors.green} />} label="Mes QR" hint="Billets" tone="green" style={{ width: layout.tileWidth }} onPress={() => router.push('/(tabs)/tickets')} />
          <ActionTile icon={<MapIcon size={20} color={colors.black} />} label="Pres de moi" hint={selectedCity ?? 'Toutes villes'} tone="yellow" style={{ width: layout.tileWidth }} onPress={() => router.push('/(tabs)/search')} />
        </View>

        <SectionBlock eyebrow="Filtres" title="Choix rapides">
          <View style={styles.chipWrap}>
            {cityOptions.map((city) => {
              const active = (city === 'Tout' && !selectedCity) || city === selectedCity;
              return (
                <Chip
                  key={city}
                  label={city}
                  active={active}
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
            {categoryOptions.map((category) => (
              <Chip
                key={category}
                label={category === 'all' ? 'Tout' : category}
                active={selectedCategory === category}
                onPress={() => {
                  setSelectedCategory(category);
                  void persistPrefs(selectedCity, category);
                }}
              />
            ))}
          </View>
        </SectionBlock>

        <SectionBlock eyebrow="Pour toi" title="A voir">
          <View style={styles.stack}>
            {filtered.slice(0, 5).map((event) => (
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
            ))}
          </View>
        </SectionBlock>

        <SectionBlock eyebrow="Bientot" title="Petite selection">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {featured.slice(0, 6).map((event) => (
              <Pressable key={event.id} style={[styles.poster, { width: layout.featuredPosterWidth }]} onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}>
                <ImageBackground source={{ uri: event.imageUrl }} style={[styles.posterImage, { height: layout.featuredPosterHeight }]} imageStyle={styles.posterImageInner}>
                  <View style={styles.posterShade} />
                  <Text style={styles.posterCategory}>{event.category}</Text>
                  <Text style={styles.posterTitle} numberOfLines={2}>{event.title}</Text>
                  <View style={styles.posterMeta}>
                    <CalendarIcon size={12} color={colors.bg} />
                    <Text style={styles.posterMetaText}>{event.date}</Text>
                  </View>
                </ImageBackground>
              </Pressable>
            ))}
          </ScrollView>
        </SectionBlock>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1 },
  content: { paddingTop: 14 },
  mark: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  markText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.ivory, letterSpacing: 2.4 },
  heroActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  primaryButton: { flex: 1, backgroundColor: colors.orange, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.black },
  secondaryButton: { minWidth: 116, borderRadius: 18, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong },
  secondaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stack: { gap: 12 },
  rail: { gap: 12, paddingRight: 8 },
  poster: {},
  posterImage: { borderRadius: 26, overflow: 'hidden', padding: 14, justifyContent: 'flex-end', gap: 8 },
  posterImageInner: { borderRadius: 26 },
  posterShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(17,17,17,0.28)' },
  posterCategory: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.ivory },
  posterTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.ivory },
  posterMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  posterMetaText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.ivory },
});
