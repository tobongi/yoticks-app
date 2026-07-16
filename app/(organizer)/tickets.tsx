import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FALLBACK_TICKETS, listOrganizerTickets, type BackendTicket } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { CalendarIcon, MapIcon } from '../../src/icons';
import { colors } from '../../src/theme/colors';
import { HeroPanel, LivedBackground, ScreenHeader, SectionBlock, StatRow, VisualCard } from '../../src/ui/lived-in';
import { TicketStubArt } from '../../src/ui/pictograms';

export default function OrganizerTickets() {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState<BackendTicket[]>(FALLBACK_TICKETS);

  useEffect(() => {
    if (!user) {
      return;
    }
    listOrganizerTickets(token ?? undefined, user.id).then(setTickets);
  }, [token, user]);

  const ordered = useMemo(() => [...tickets].sort((a, b) => Number(a.status === 'valid') - Number(b.status === 'valid')), [tickets]);
  const valid = ordered.filter((item) => item.status === 'valid');
  const past = ordered.filter((item) => item.status !== 'valid');

  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Organisateur" title="Billets" />
        <HeroPanel eyebrow="Contrôle" title={`${ordered.length} billets`} subtitle="Prêts puis passés" art={<TicketStubArt tone="blue" size={92} />}>
          <StatRow items={[{ label: 'Ouverts', value: String(valid.length) }, { label: 'Passes', value: String(past.length) }, { label: 'Total', value: String(ordered.length) }]} />
        </HeroPanel>

        <SectionBlock eyebrow="A voir" title="Tous">
          <View style={styles.stack}>
            {ordered.map((ticket) => (
              <VisualCard
                key={ticket.id}
                title={ticket.holderName}
                subtitle={ticket.status === 'valid' ? 'Ouvert' : ticket.status === 'used' ? 'Passe' : 'Annule'}
                meta={`${ticket.event.title} • ${ticket.gate ?? 'Sans porte'}`}
                badge={ticket.code}
                onPress={() => router.push(`/(organizer)/tickets/${ticket.id}` as never)}
                right={
                  <View style={styles.icons}>
                    <CalendarIcon size={14} color={colors.orange} />
                    <MapIcon size={14} color={colors.orange} />
                  </View>
                }
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
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110, gap: 18 },
  stack: { gap: 12 },
  icons: { gap: 8, paddingRight: 4 },
});
