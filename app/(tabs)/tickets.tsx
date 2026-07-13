import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FALLBACK_TICKETS, listTickets, type BackendTicket } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { useLiveRefresh } from '../../src/live-refresh';
import { buildTicketDigest } from '../../src/app-redesign';
import { CalendarIcon, MapIcon, QrIcon, TicketIcon } from '../../src/icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { HeroPanel, LivedBackground, ScreenHeader, SectionBlock, StatRow, VisualCard } from '../../src/ui/lived-in';
import { usePhoneLayout } from '../../src/ui/responsive';

export default function TicketsScreen() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<BackendTicket[]>(FALLBACK_TICKETS);
  const refreshTick = useLiveRefresh(2500);
  const layout = usePhoneLayout();

  useEffect(() => {
    listTickets(token ?? undefined).then(setTickets);
  }, [refreshTick, token]);

  const digest = buildTicketDigest(tickets);
  const featured = digest.active[0] ?? tickets[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingHorizontal: layout.screenPadding, paddingBottom: layout.isCompact ? 96 : 110, gap: layout.sectionGap }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="Billets" title="Mes QR" />

        <HeroPanel
          eyebrow={featured ? (featured.status === 'valid' ? 'Pret' : 'Archive') : 'Vide'}
          title={featured?.event.title ?? 'Aucun billet'}
          subtitle={featured ? `${featured.event.location} • ${featured.event.date}` : 'Vos billets apparaitront ici'}
          art={<QrIcon size={36} color={colors.orange} />}
        >
          <StatRow items={digest.stats} />
          {featured ? (
            <Pressable style={styles.heroPass} onPress={() => router.push(`/ticket/${featured.id}`)}>
              <ImageBackground source={{ uri: featured.event.imageUrl }} style={styles.heroPassImage} imageStyle={styles.heroPassInner}>
                <View style={styles.heroPassShade} />
                <View style={styles.heroPassTop}>
                  <Text style={styles.heroPassTag}>{featured.event.category}</Text>
                  <View style={styles.codePill}>
                    <TicketIcon size={12} color={colors.bg} />
                    <Text style={styles.codePillText}>{featured.code}</Text>
                  </View>
                </View>
                <Text style={styles.heroPassTitle}>{featured.event.title}</Text>
              </ImageBackground>
            </Pressable>
          ) : null}
        </HeroPanel>

        <SectionBlock eyebrow="Actifs" title={`${digest.active.length} prets`}>
          <View style={styles.stack}>
            {digest.active.map((ticket) => (
              <VisualCard
                key={ticket.id}
                title={ticket.event.title}
                subtitle={ticket.seat}
                meta={`${ticket.event.location} • ${ticket.event.date}`}
                imageUrl={ticket.event.imageUrl}
                badge={ticket.code}
                onPress={() => router.push(`/ticket/${ticket.id}`)}
                right={
                  <View style={styles.sideMeta}>
                    <CalendarIcon size={14} color={colors.orange} />
                    <MapIcon size={14} color={colors.orange} />
                  </View>
                }
              />
            ))}
          </View>
        </SectionBlock>

        <SectionBlock eyebrow="Passes" title={`${digest.archived.length} deja utilises`}>
          <View style={styles.stack}>
            {digest.archived.map((ticket) => (
              <VisualCard
                key={ticket.id}
                title={ticket.event.title}
                subtitle={ticket.status === 'used' ? 'Passe' : 'Annule'}
                meta={`${ticket.event.location} • ${ticket.event.date}`}
                imageUrl={ticket.event.imageUrl}
                badge={ticket.code}
                onPress={() => router.push(`/ticket/${ticket.id}`)}
              />
            ))}
          </View>
        </SectionBlock>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1 },
  content: { paddingTop: 14 },
  heroPass: { overflow: 'hidden', borderRadius: 24 },
  heroPassImage: { minHeight: 170, padding: 14, justifyContent: 'space-between' },
  heroPassInner: { borderRadius: 24 },
  heroPassShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(17,17,17,0.26)' },
  heroPassTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  heroPassTag: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.ivory },
  codePill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(17,17,17,0.3)' },
  codePillText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.ivory },
  heroPassTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.ivory },
  stack: { gap: 12 },
  sideMeta: { gap: 8, paddingRight: 4 },
});
