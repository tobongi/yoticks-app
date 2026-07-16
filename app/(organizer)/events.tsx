import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FALLBACK_EVENTS, listOrganizerEvents, type BackendEvent } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { useLiveRefresh } from '../../src/live-refresh';
import { colors } from '../../src/theme/colors';
import { HeroPanel, LivedBackground, ScreenHeader, SectionBlock, VisualCard } from '../../src/ui/lived-in';
import { Pictogram } from '../../src/ui/pictograms';
import { ClipboardIcon } from '../../src/icons';

export default function OrganizerEvents() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const refreshTick = useLiveRefresh(3200);

  useEffect(() => {
    if (!user) {
      return;
    }
    const fallback = FALLBACK_EVENTS.filter((event) => event.organizerId === user.id);
    setEvents(fallback);
    listOrganizerEvents(token ?? undefined, user.id).then(setEvents);
  }, [refreshTick, token, user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Organisateur" title="Mes sorties" />
        <HeroPanel eyebrow="Événements" title={`${events.length} affiches`} subtitle="Créer ou modifier" art={<Pictogram pictogram="celebrate" tone="yellow" size={80} />}>
          <Pressable accessibilityRole="button" accessibilityLabel="Créer un événement" style={styles.primaryButton} onPress={() => router.push('/(organizer)/events/new' as never)}>
            <Text style={styles.primaryButtonText}>Nouvel event</Text>
          </Pressable>
        </HeroPanel>

        <SectionBlock eyebrow="Liste" title="A gerer">
          {events.map((event) => (
            <VisualCard
              key={event.id}
              title={event.title}
              subtitle={event.status === 'draft' ? 'Brouillon' : 'Publie'}
              meta={`${event.location} • ${event.date}`}
              imageUrl={event.imageUrl}
              badge={event.price}
              onPress={() => router.push(`/(organizer)/events/${event.id}` as never)}
              right={<ClipboardIcon size={18} color={colors.orange} />}
            />
          ))}
        </SectionBlock>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110, gap: 18 },
  primaryButton: { borderRadius: 18, backgroundColor: colors.orange, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.black },
});
