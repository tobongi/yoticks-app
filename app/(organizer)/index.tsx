import { useEffect, useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FALLBACK_EVENTS,
  getOrganizerDashboard,
  getOrganizerDashboardStats,
  getOrganizerScanStats,
  listOrganizerEvents,
  type BackendEvent,
  type BackendOrganizerDashboard,
  type BackendOrganizerDashboardStats,
  type BackendOrganizerScanStats,
} from '../../src/backend';
import { useAuth } from '../../src/auth';
import { useLiveRefresh } from '../../src/live-refresh';
import { buildOrganizerDigest } from '../../src/app-redesign';
import { ClipboardIcon, MapIcon, SparkIcon, TicketIcon, UserIcon } from '../../src/icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { ActionTile, HeroPanel, InlineScroll, LivedBackground, ProgressBar, ScreenHeader, SectionBlock, StatRow, VisualCard } from '../../src/ui/lived-in';

export default function OrganizerHome() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [dashboardStats, setDashboardStats] = useState<BackendOrganizerDashboardStats>({ sales: 0, events: 0, cities: 0, scanRate: 0 });
  const [dashboard, setDashboard] = useState<BackendOrganizerDashboard | null>(null);
  const [scanStats, setScanStats] = useState<BackendOrganizerScanStats | null>(null);
  const refreshTick = useLiveRefresh(2400);

  useEffect(() => {
    if (!user) {
      return;
    }
    const fallback = FALLBACK_EVENTS.filter((event) => event.organizerId === user.id);
    setEvents(fallback);
    listOrganizerEvents(token ?? undefined, user.id).then(setEvents);
    getOrganizerDashboardStats(token ?? undefined, user.id).then(setDashboardStats);
    getOrganizerDashboard(token ?? undefined, user.id).then(setDashboard);
    getOrganizerScanStats(token ?? undefined, user.id).then(setScanStats);
  }, [refreshTick, token, user?.id]);

  const digest = useMemo(() => buildOrganizerDigest(dashboardStats, scanStats, events.length), [dashboardStats, events.length, scanStats]);
  const heroEvent = events[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Organizer" title="Tableau de bord" side={<Pressable accessibilityRole="button" accessibilityLabel="Ouvrir le profil organisateur" style={styles.avatar} onPress={() => router.push('/(organizer)/profile' as never)}><Text style={styles.avatarText}>{getInitials(user?.name ?? 'Org')}</Text></Pressable>} />

        <HeroPanel eyebrow="Live" title="Pilotage simple" subtitle="Ventes, scans, events." art={<SparkIcon size={36} color={colors.orange} />}>
          <StatRow items={digest.stats} />
          {heroEvent ? (
            <Pressable style={styles.heroEvent} onPress={() => router.push('/(organizer)/events' as never)}>
              <ImageBackground source={{ uri: heroEvent.imageUrl }} style={styles.heroEventImage} imageStyle={styles.heroEventInner}>
                <View style={styles.heroEventShade} />
                <Text style={styles.heroEventLabel}>{heroEvent.category}</Text>
                <Text style={styles.heroEventTitle}>{heroEvent.title}</Text>
              </ImageBackground>
            </Pressable>
          ) : null}
        </HeroPanel>

        <InlineScroll contentContainerStyle={styles.tileRow}>
          <ActionTile icon={<ClipboardIcon size={20} color={colors.orange} />} label="Scan" hint="Entree" onPress={() => router.push('/(organizer)/scan' as never)} />
          <ActionTile icon={<TicketIcon size={20} color={colors.green} />} label="Billets" hint="Vendus" tone="green" onPress={() => router.push('/(organizer)/tickets' as never)} />
          <ActionTile icon={<UserIcon size={20} color={colors.black} />} label="Events" hint="Editer" tone="yellow" onPress={() => router.push('/(organizer)/events' as never)} />
          <ActionTile icon={<MapIcon size={20} color={colors.orange} />} label="Villes" hint="Zones" onPress={() => router.push('/(organizer)/cities' as never)} />
        </InlineScroll>

        {scanStats ? (
          <SectionBlock eyebrow="Entree" title="Scans en direct">
            <View style={styles.scanCard}>
              <View style={styles.scanTop}>
                <Text style={styles.scanBig}>{scanStats.usedTickets}</Text>
                <Text style={styles.scanMeta}>sur {scanStats.totalTickets}</Text>
              </View>
              <ProgressBar value={scanStats.usedTickets} total={scanStats.totalTickets} />
              <View style={styles.scanFoot}>
                <Text style={styles.scanFootText}>Attente {scanStats.pending}</Text>
                <Text style={styles.scanFootText}>Bloques {scanStats.queued}</Text>
              </View>
            </View>
          </SectionBlock>
        ) : null}

        <SectionBlock eyebrow="Events" title="A suivre">
          <View style={styles.stack}>
            {events.slice(0, 5).map((event) => (
              <VisualCard
                key={event.id}
                title={event.title}
                subtitle={event.status === 'draft' ? 'Brouillon' : 'Publie'}
                meta={`${event.location} • ${event.date}`}
                imageUrl={event.imageUrl}
                badge={event.price}
                onPress={() => router.push('/(organizer)/events' as never)}
              />
            ))}
          </View>
        </SectionBlock>

        {dashboard ? (
          <SectionBlock eyebrow="Funnel" title="Lecture rapide">
            <View style={styles.stack}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Vues</Text>
                <Text style={styles.metricValue}>{dashboard.funnel.views}</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Paniers</Text>
                <Text style={styles.metricValue}>{dashboard.funnel.checkouts}</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Achats</Text>
                <Text style={styles.metricValue}>{dashboard.funnel.purchases}</Text>
              </View>
            </View>
          </SectionBlock>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110, gap: 18 },
  avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.ivory },
  heroEvent: { overflow: 'hidden', borderRadius: 24 },
  heroEventImage: { minHeight: 150, padding: 14, justifyContent: 'space-between' },
  heroEventInner: { borderRadius: 24 },
  heroEventShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(17,17,17,0.24)' },
  heroEventLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.ivory },
  heroEventTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.ivory },
  tileRow: { gap: 10, paddingRight: 8 },
  scanCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 16, gap: 12 },
  scanTop: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  scanBig: { fontFamily: typography.fontFamily.bold, fontSize: 42, color: colors.text },
  scanMeta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.textMuted, paddingBottom: 6 },
  scanFoot: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  scanFootText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  stack: { gap: 12 },
  metricBlock: { borderRadius: 22, padding: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 4 },
  metricLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  metricValue: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text },
});
