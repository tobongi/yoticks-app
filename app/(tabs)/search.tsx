import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchEvents, type BackendSearchResponse } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { useLiveRefresh } from '../../src/live-refresh';
import { SearchIcon } from '../../src/icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { Chip, HeroPanel, InlineScroll, LivedBackground, ScreenHeader, SectionBlock, VisualCard } from '../../src/ui/lived-in';
import { SavedEventButton } from '../../src/saved-event-button';
import { Pictogram, VisualState } from '../../src/ui/pictograms';
import { getCategoryVisual } from '../../src/ui/visual-language';

const EMPTY_SEARCH: BackendSearchResponse = {
  query: '',
  queryWords: [],
  normalizedQuery: '',
  suggestions: [],
  results: [],
  facets: { categories: [], cities: [] },
};

export default function SearchScreen() {
  const params = useLocalSearchParams<{ query?: string }>();
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<BackendSearchResponse>(EMPTY_SEARCH);
  const refreshTick = useLiveRefresh(3000);

  useEffect(() => {
    if (typeof params.query === 'string') {
      setQuery(params.query);
    }
  }, [params.query]);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      searchEvents(query, token ?? undefined).then((next) => {
        if (!cancelled) {
          setData(next);
        }
      });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, refreshTick, token]);

  const chips = useMemo(() => data.suggestions.slice(0, 6), [data.suggestions]);
  const cities = useMemo(() => data.facets.cities.slice(0, 6), [data.facets.cities]);
  const trends = useMemo(() => data.facets.categories.slice(0, 6), [data.facets.categories]);

  const openSearch = (value: string) => {
    setQuery(value);
    router.replace({ pathname: '/search', params: { query: value } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Explorer" title="Trouver vite" />

        <HeroPanel title={query || 'Que veux-tu voir ?'} subtitle={`${data.results.length} trouvé${data.results.length > 1 ? 's' : ''}`} art={<Pictogram pictogram="search" size={74} />}>
          <View style={styles.searchBar}>
            <SearchIcon size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Chercher"
              placeholderTextColor={colors.textMuted}
              autoFocus
              accessibilityLabel="Chercher un événement"
            />
          </View>
        </HeroPanel>

        {!!chips.length && (
          <SectionBlock eyebrow="Mots" title="Essayer">
            <InlineScroll>
              {chips.map((chip) => (
                <Chip key={chip} label={chip} onPress={() => openSearch(chip)} />
              ))}
            </InlineScroll>
          </SectionBlock>
        )}

        {!!trends.length && (
          <SectionBlock eyebrow="Chaud" title="Tendances">
            <View style={styles.iconStack}>
              {trends.map((item) => {
                const visual = getCategoryVisual(item.label);
                return <Chip key={item.label} label={`${visual.label} ${item.count}`} pictogram={visual.key} tone={visual.tone} onPress={() => openSearch(item.label)} />;
              })}
            </View>
          </SectionBlock>
        )}

        {!!cities.length && (
          <SectionBlock eyebrow="Lieu" title="Villes">
            <InlineScroll>
              {cities.map((city) => (
                <Chip key={city.label} label={`${city.label} ${city.count}`} pictogram="map" tone="yellow" onPress={() => openSearch(city.label)} />
              ))}
            </InlineScroll>
          </SectionBlock>
        )}

        <SectionBlock eyebrow="Resultats" title={query ? 'Ce qui sort' : 'A ouvrir'}>
          <View style={styles.stack}>
            {data.results.length > 0 ? (
              data.results.map((event) => (
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
              <View style={styles.emptyCard}><VisualState art={<Pictogram pictogram="search" tone="blue" size={94} />} title="Rien ici" action={<Chip label="Tout voir" pictogram="celebrate" onPress={() => openSearch('')} />} /></View>
            )}
          </View>
        </SectionBlock>

        {!!data.followedOrganizerEvents?.length && (
          <SectionBlock eyebrow="Follow" title="Createurs suivis">
            <View style={styles.stack}>
              {data.followedOrganizerEvents.slice(0, 4).map((event) => (
                <VisualCard
                  key={`f-${event.id}`}
                  title={event.title}
                  subtitle={event.organizer}
                  meta={`${event.location} • ${event.date}`}
                  imageUrl={event.imageUrl}
                  badge={event.price}
                  onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
                />
              ))}
            </View>
          </SectionBlock>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110, gap: 18 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.text },
  iconStack: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stack: { gap: 12 },
  emptyCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card },
});
