import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FALLBACK_TICKETS, listTickets, type BackendTicket } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { REFRESH, useLiveRefresh } from '../../src/live-refresh';
import { buildTicketDigest } from '../../src/app-redesign';
import { TicketIcon } from '../../src/icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { HeroPanel, PrimaryAction, ScreenHeader, SectionBlock, StatRow, VisualCard } from '../../src/ui/lived-in';
import { Pictogram, StatusSeal, TicketStubArt, VisualState } from '../../src/ui/pictograms';
import { getTicketVisual } from '../../src/ui/visual-language';
import { Screen } from '../../src/ui/screen';
import { ImageScrim } from '../../src/ui/image-scrim';

export default function TicketsScreen() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<BackendTicket[]>(FALLBACK_TICKETS);
  const refreshTick = useLiveRefresh(REFRESH.normal);

  useEffect(() => {
    listTickets(token ?? undefined).then(setTickets);
  }, [refreshTick, token]);

  const digest = buildTicketDigest(tickets);
  const featured = digest.active[0] ?? tickets[0];

  return (
    <Screen>
      <ScreenHeader eyebrow="Billets" title="Mes QR" />

      <HeroPanel
        eyebrow={featured ? getTicketVisual(featured.status).label : undefined}
        title={featured?.event.title ?? 'Aucun billet'}
        subtitle={featured ? `${featured.event.location} • ${featured.event.date}` : undefined}
        art={<TicketStubArt tone={featured?.status === 'valid' ? 'green' : 'ink'} size={94} />}
      >
        <StatRow items={digest.stats} />
        {featured ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Ouvrir le billet ${featured.event.title}`} style={styles.heroPass} onPress={() => router.push(`/ticket/${featured.id}`)}>
            <ImageBackground source={{ uri: featured.event.imageUrl }} style={styles.heroPassImage} imageStyle={styles.heroPassInner}>
              <ImageScrim id="pass" />
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
        ) : <VisualState art={<Pictogram pictogram="ticket" tone="blue" size={96} />} title="Pas encore de billet" action={<PrimaryAction label="Trouver une sortie" pictogram="search" onPress={() => router.push('/(tabs)/search')} />} />}
        {featured ? <PrimaryAction label="Ouvrir le QR" pictogram="scan" tone="green" onPress={() => router.push(`/ticket/${featured.id}`)} /> : null}
      </HeroPanel>

      <SectionBlock eyebrow="Actifs" title={`${digest.active.length} prêts`}>
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
              right={<StatusSeal pictogram={getTicketVisual(ticket.status).key} tone={getTicketVisual(ticket.status).tone} label={getTicketVisual(ticket.status).label} hint={getTicketVisual(ticket.status).hint} size={48} />}
            />
          ))}
        </View>
      </SectionBlock>

      <SectionBlock eyebrow="Passes" title={`${digest.archived.length} déjà utilisés`}>
        <View style={styles.stack}>
          {digest.archived.map((ticket) => (
            <VisualCard
              key={ticket.id}
              title={ticket.event.title}
              subtitle={getTicketVisual(ticket.status).label}
              meta={`${ticket.event.location} • ${ticket.event.date}`}
              imageUrl={ticket.event.imageUrl}
              badge={ticket.code}
              onPress={() => router.push(`/ticket/${ticket.id}`)}
              right={<StatusSeal pictogram={getTicketVisual(ticket.status).key} tone={getTicketVisual(ticket.status).tone} label={getTicketVisual(ticket.status).label} hint={getTicketVisual(ticket.status).hint} size={44} />}
            />
          ))}
        </View>
      </SectionBlock>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroPass: { overflow: 'hidden', borderRadius: 24 },
  heroPassImage: { minHeight: 170, padding: 14, justifyContent: 'space-between' },
  heroPassInner: { borderRadius: 24 },
  heroPassTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  heroPassTag: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.ivory },
  codePill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(17,17,17,0.3)' },
  codePillText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.ivory },
  heroPassTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.ivory },
  stack: { gap: 12 },
});
