import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProfileSummary, listEvents, listSavedEvents, type BackendProfileSummary, type BackendSavedEvent } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { useI18n } from '../../src/i18n';
import { useLiveRefresh } from '../../src/live-refresh';
import { useSavedEvents } from '../../src/saved-events';
import { BellIcon, GlobeIcon, TentIcon, TicketIcon, UserIcon } from '../../src/icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { ActionTile, Chip, HeroPanel, LivedBackground, ScreenHeader, SectionBlock, StatRow, VisualCard } from '../../src/ui/lived-in';
import { usePhoneLayout } from '../../src/ui/responsive';

const FALLBACK_SUMMARY: BackendProfileSummary = {
  user: { id: 'demo', email: 'jean.dupont@example.com', name: 'Jean Dupont', role: 'attendee', avatarUrl: null, totalSpend: 0 },
  stats: { ticketsPurchased: 3, eventsFollowed: 3, citiesVisited: 3, totalSpend: 33000 },
};

export default function ProfileScreen() {
  const { token, user, signOut } = useAuth();
  const { locale, setLocale } = useI18n();
  const { savedIds, toggleSavedEvent } = useSavedEvents();
  const refreshTick = useLiveRefresh(3200);
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
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingHorizontal: layout.screenPadding, paddingBottom: layout.isCompact ? 96 : 110, gap: layout.sectionGap }]}
        showsVerticalScrollIndicator={false}
      >
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
          <ActionTile icon={<TicketIcon size={20} color={colors.orange} />} label="Mes QR" hint="Ouvrir" style={{ width: layout.tileWidth }} onPress={() => router.push('/(tabs)/tickets')} />
          <ActionTile icon={<BellIcon size={20} color={colors.green} />} label="Alertes" hint="Inbox" tone="green" style={{ width: layout.tileWidth }} onPress={() => router.push('/notifications')} />
          <ActionTile icon={<TentIcon size={20} color={colors.black} />} label="Mode orga" hint="Tableau" tone="yellow" style={{ width: layout.tileWidth }} onPress={() => router.push('/(organizer)' as never)} />
          <ActionTile icon={<UserIcon size={20} color={colors.orange} />} label="Quitter" hint="Sortie" style={{ width: layout.tileWidth }} onPress={() => { signOut(); router.replace('/auth/login'); }} />
        </View>

        <SectionBlock eyebrow="Langue" title="Parler simple">
          <View style={styles.chipWrap}>
            <Chip label="Francais" active={locale === 'fr'} onPress={() => setLocale('fr')} />
            <Chip label="English" active={locale === 'en'} onPress={() => setLocale('en')} />
          </View>
        </SectionBlock>

        <SectionBlock eyebrow="Sauves" title={`${saved.length} favoris`}>
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
                    <Pressable
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
              <View style={styles.emptyCard}>
                <GlobeIcon size={24} color={colors.orange} />
                <Text style={styles.emptyTitle}>Rien garde</Text>
                <Text style={styles.emptyCopy}>Sauve un event pour le revoir ici.</Text>
              </View>
            )}
          </View>
        </SectionBlock>

        <Pressable style={styles.helpCard} onPress={() => Alert.alert('Aide', 'Utilise les gros boutons pour aller plus vite.')}>
          <Text style={styles.helpTitle}>Aide rapide</Text>
          <Text style={styles.helpCopy}>Billets, recherche, profil, orga.</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Se deconnecter"
          style={styles.signOutButton}
          onPress={() => {
            signOut();
            router.replace('/auth/login');
          }}
        >
          <Text style={styles.signOutButtonText}>Se deconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1 },
  content: { paddingTop: 14 },
  avatar: { width: 68, height: 68, borderRadius: 24, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.ivory },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stack: { gap: 12 },
  removeButton: { paddingHorizontal: 8, paddingVertical: 6 },
  removeText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.red },
  emptyCard: { borderRadius: 24, padding: 18, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, gap: 8 },
  emptyTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text },
  emptyCopy: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  helpCard: { borderRadius: 24, padding: 18, backgroundColor: colors.black, gap: 8 },
  helpTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.ivory },
  helpCopy: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.beige },
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
