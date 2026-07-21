import { useEffect, useMemo, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FALLBACK_EVENTS, getEvent, listEvents, type BackendEvent } from '../../src/backend';
import { buildEventDetailModel } from '../../src/event-detail';
import { REFRESH, useLiveRefresh } from '../../src/live-refresh';
import { ArrowLeftIcon, CalendarIcon, MapIcon } from '../../src/icons';
import { SavedEventButton } from '../../src/saved-event-button';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { space } from '../../src/theme/tokens';
import { Button, HeroPanel, MetaPill, ProgressBar, SectionBlock, VisualCard } from '../../src/ui/lived-in';
import { Screen } from '../../src/ui/screen';
import { usePhoneLayout } from '../../src/ui/responsive';
import { Pictogram } from '../../src/ui/pictograms';
import { getCategoryVisual, type PictogramKey } from '../../src/ui/visual-language';
import { ImageScrim } from '../../src/ui/image-scrim';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [allEvents, setAllEvents] = useState<BackendEvent[]>(FALLBACK_EVENTS);
  const refreshTick = useLiveRefresh(REFRESH.normal);
  const layout = usePhoneLayout();

  useEffect(() => {
    if (typeof id !== 'string' || !id.trim()) {
      setEvent(null);
      return;
    }
    let active = true;
    getEvent(id).then((next) => active && setEvent(next ?? null));
    listEvents().then((next) => active && setAllEvents(next));
    return () => {
      active = false;
    };
  }, [id, refreshTick]);

  const current = event ?? (typeof id === 'string' ? FALLBACK_EVENTS.find((item) => item.id === id) ?? FALLBACK_EVENTS[0] : FALLBACK_EVENTS[0]);
  const model = useMemo(() => buildEventDetailModel(current, allEvents), [allEvents, current]);
  const firstTier = current.tiers?.[0];
  const categoryVisual = getCategoryVisual(current.category);
  const scheduleItems = current.lineup?.length
    ? current.lineup.map((item) => ({ time: item.time, title: item.title, meta: item.stage }))
    : model.timeline.map((item) => ({ time: item.time, title: item.title, meta: item.description }));

  return (
    <Screen
      footer={
        <View style={styles.bottomBar}>
          <View style={styles.bottomCopy}>
            <Text style={styles.bottomMeta} numberOfLines={1}>{current.location}</Text>
            <Text style={styles.bottomTitle} numberOfLines={1}>{current.price}</Text>
          </View>
          <Button
            label="Y aller"
            accessibilityLabel={`Réserver ${current.title}`}
            fullWidth={false}
            buttonSize="lg"
            onPress={() => router.push({ pathname: '/reserver/[id]', params: { id: current.id } })}
          />
        </View>
      }
    >
      <Pressable accessibilityRole="button" accessibilityLabel="Retour à la page précédente" style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
        <ArrowLeftIcon size={16} color={colors.orangeInk} />
        <Text style={styles.backText}>Retour</Text>
      </Pressable>

      <ImageBackground source={{ uri: current.imageUrl }} style={[styles.heroImage, { minHeight: layout.heroImageMinHeight }]} imageStyle={styles.heroImageInner}>
        <ImageScrim id="event-hero" />
        <View style={styles.heroTop}>
          <Text style={styles.heroPrice}>{current.price}</Text>
          <SavedEventButton compact eventId={current.id} />
        </View>
        <Text style={styles.heroCategory}>{current.category}</Text>
        <Text style={[styles.heroTitle, { fontSize: layout.eventTitleSize, lineHeight: layout.eventTitleLineHeight }]}>{current.title}</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaChip}>
            <CalendarIcon size={12} color={colors.bg} />
            <Text style={styles.heroMetaText}>{current.date}</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <MapIcon size={12} color={colors.bg} />
            <Text style={styles.heroMetaText}>{current.location}</Text>
          </View>
        </View>
      </ImageBackground>

      {/*
        The booking action lives only in the sticky footer. It used to appear
        here as well, so the screen carried the same call to action twice —
        once mid-scroll and once in a bar that is on screen the whole time.
        One action, one place.
      */}
      <HeroPanel title={categoryVisual.label} subtitle={current.organizer} tone={categoryVisual.tone} art={<Pictogram pictogram={categoryVisual.key} tone={categoryVisual.tone} size={64} />}>
        <Text style={styles.description}>{current.description}</Text>
      </HeroPanel>

      <SectionBlock eyebrow="Infos" title="Lecture rapide">
        <View style={styles.factGrid}>
          {model.facts.slice(0, 4).map((fact, index) => <MetaPill key={fact.label} pictogram={(['ticket', 'map', 'people', 'history'] as PictogramKey[])[index] ?? 'ticket'} tone={index === 1 ? 'yellow' : index === 2 ? 'blue' : 'orange'} label={fact.label} value={fact.value} />)}
        </View>
      </SectionBlock>

      {current.tiers?.length ? (
        <SectionBlock eyebrow="Billets" title="Places">
          <View style={styles.stack}>
            {current.tiers.map((tier) => {
              const sold = tier.inventoryTotal - tier.inventoryRemaining;
              return (
                <View key={tier.key} style={styles.tierCard}>
                  <View style={styles.tierTop}>
                    <View>
                      <Text style={styles.tierName}>{tier.name}</Text>
                      <Text style={styles.tierMeta}>{tier.price}</Text>
                    </View>
                    <Text style={styles.tierMeta}>{tier.inventoryRemaining} restants</Text>
                  </View>
                  <ProgressBar value={sold} total={tier.inventoryTotal} tone={tier === firstTier ? 'orange' : 'green'} />
                </View>
              );
            })}
          </View>
        </SectionBlock>
      ) : null}

      <SectionBlock eyebrow="Programme" title="Moments">
        <View style={styles.stack}>
          {scheduleItems.slice(0, 4).map((item, index) => (
            <View key={`${item.time}-${index}`} style={styles.timelineRow}>
              <Text style={styles.timelineTime}>{item.time}</Text>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineMeta}>{item.meta}</Text>
              </View>
            </View>
          ))}
        </View>
      </SectionBlock>

      <SectionBlock eyebrow="Encore" title="Aussi bien">
        <View style={styles.stack}>
          {model.relatedEvents.slice(0, 4).map((item) => (
            <VisualCard
              key={item.id}
              title={item.title}
              subtitle={item.category}
              meta={`${item.location} • ${item.date}`}
              imageUrl={item.imageUrl}
              badge={item.price}
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
            />
          ))}
        </View>
      </SectionBlock>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.orangeInk },
  heroImage: { borderRadius: 30, overflow: 'hidden', padding: 18, justifyContent: 'flex-end', gap: 10 },
  heroImageInner: { borderRadius: 30 },
  heroTop: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroPrice: { borderRadius: 999, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.88)', fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  heroCategory: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.ivory },
  heroTitle: { fontFamily: typography.fontFamily.bold, color: colors.ivory },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: 'rgba(17,17,17,0.3)', paddingHorizontal: 10, paddingVertical: 7 },
  heroMetaText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.ivory },
  description: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, lineHeight: 23, color: colors.textSecondary },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stack: { gap: 12 },
  tierCard: { borderRadius: 22, padding: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 },
  tierTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  tierName: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  tierMeta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  timelineRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 22, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  timelineTime: { width: 54, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orangeInk },
  timelineBody: { flex: 1, gap: 3 },
  timelineTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  timelineMeta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  bottomCopy: { flex: 1, gap: space.xxs },
  bottomMeta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  bottomTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text },
});
