import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { getProfileSummary, listEvents, listSavedEvents, type BackendProfileSummary, type BackendSavedEvent } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { useI18n } from '../../src/i18n';
import { REFRESH, useLiveRefresh } from '../../src/live-refresh';
import { useSavedEvents } from '../../src/saved-events';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { ActionTile, Chip, HeroPanel, ScreenHeader, SectionBlock, StatRow, VisualCard } from '../../src/ui/lived-in';
import { usePhoneLayout } from '../../src/ui/responsive';
import { Pictogram, VisualState } from '../../src/ui/pictograms';
import { Screen } from '../../src/ui/screen';

const FALLBACK_SUMMARY: BackendProfileSummary = {
  user: { id: 'demo', email: 'jean.dupont@example.com', name: 'Jean Dupont', role: 'attendee', avatarUrl: null, totalSpend: 0 },
  stats: { ticketsPurchased: 3, eventsFollowed: 3, citiesVisited: 3, totalSpend: 33000 },
};

export default function ProfileScreen() {
  const { token, user, signOut } = useAuth();
  const { locale, setLocale } = useI18n();
  const { savedIds, toggleSavedEvent } = useSavedEvents();
  const refreshTick = useLiveRefresh(REFRESH.slow);
  const layout = usePhoneLayout();
  const [summary, setSummary] = useState<BackendProfileSummary>(FALLBACK_SUMMARY);
  const [saved, setSaved] = useState<BackendSavedEvent[]>([]);

  useEffect(() => {
    getProfileSummary(token ?? undefined).then(setSummary);
  }, [refreshTick, token]);

  useEffect(() => {
    let active = true;
    if (token) {
      listSavedEvents(token).then((items) => active && setSaved(items));
    } else {
      listEvents().then((events) => {
        if (active) {
          setSaved(events.filter((event) => savedIds.includes(event.id)).map((event) => ({ event, createdAt: new Date(0).toISOString() })));
        }
      });
    }
    return () => {
      active = false;
    };
  }, [refreshTick, savedIds, token]);

  const initials = summary.user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Screen>
      <ScreenHeader eyebrow={summary.user.role === 'organizer' ? 'Organisateur' : 'Compte'} title="Moi" />

      <HeroPanel eyebrow={summary.user.email ?? 'Compte'} title={summary.user.name} subtitle={user?.role === 'organizer' ? 'Mode orga actif' : 'Billets, langues, favoris'} art={<View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>}>
        <StatRow
          items={[
            { label: 'Billets', value: String(summary.stats.ticketsPurchased) },
            { label: 'Suivis', value: String(token ? summary.stats.eventsFollowed : savedIds.length) },
            { label: 'Villes', value: String(summary.stats.citiesVisited) },
          ]}
        />
      </HeroPanel>

      <View style={styles.tileGrid}>
        <ActionTile icon={<Pictogram pictogram="ticket" tone="blue" size={46} />} label="Mes QR" tone="blue" style={{ width: layout.tileWidth }} onPress={() => router.push('/(tabs)/tickets')} />
        <ActionTile icon={<Pictogram pictogram="bell" tone="orange" size={46} />} label="Alertes" style={{ width: layout.tileWidth }} onPress={() => router.push('/notifications')} />
        <ActionTile icon={<Pictogram pictogram="profile" tone="yellow" size={46} />} label="Réglages" tone="yellow" style={{ width: layout.tileWidth }} onPress={() => router.push('/settings' as never)} />
        <ActionTile icon={<Pictogram pictogram="help" tone="blue" size={46} />} label="Aide" tone="blue" style={{ width: layout.tileWidth }} onPress={() => Alert.alert('Aide', 'Appuie sur une image pour continuer.')} />
      </View>

      <SectionBlock eyebrow="Langue" title="Parler simple">
        <View style={styles.chipWrap}>
          <Chip label="Français" pictogram="talk" tone="blue" active={locale === 'fr'} onPress={() => setLocale('fr')} />
          <Chip label="English" pictogram="talk" tone="green" active={locale === 'en'} onPress={() => setLocale('en')} />
        </View>
      </SectionBlock>

      <SectionBlock eyebrow="Sauvés" title={`${saved.length} favoris`}>
        <View style={styles.stack}>
          {saved.length > 0 ? (
            saved.map((entry) => (
              <VisualCard
                key={entry.event.id}
                title={entry.event.title}
                subtitle={entry.event.category}
                meta={`${entry.event.location} • ${entry.event.date}`}
                imageUrl={entry.event.imageUrl}
                badge={entry.event.price}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: entry.event.id } })}
                right={
                  <Pressable accessibilityRole="button" accessibilityLabel={`Retirer ${entry.event.title} des favoris`}
                    style={styles.removeButton}
                    onPress={async () => {
                      const stillSaved = await toggleSavedEvent(entry.event.id);
                      if (!stillSaved) {
                        setSaved((current) => current.filter((item) => item.event.id !== entry.event.id));
                      }
                    }}
                  >
                    <Text style={styles.removeText}>Retirer</Text>
                  </Pressable>
                }
              />
            ))
          ) : (
            <View style={styles.emptyCard}><VisualState art={<Pictogram pictogram="celebrate" size={96} />} title="Aucun favori" /></View>
          )}
        </View>
      </SectionBlock>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Se déconnecter"
        style={styles.signOutButton}
        onPress={() => {
          signOut();
          router.replace('/auth/login');
        }}
      >
        <Text style={styles.signOutButtonText}>Se déconnecter</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 68, height: 68, borderRadius: 24, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.ivory },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stack: { gap: 12 },
  removeButton: { paddingHorizontal: 8, paddingVertical: 6 },
  removeText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.red },
  emptyCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card },
  signOutButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.red + '33',
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  signOutButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.red,
  },
});
