import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { FALLBACK_TICKETS, listOrganizerTickets, type BackendTicket } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { CalendarIcon, MapIcon } from '../../src/icons';
import { colors } from '../../src/theme/colors';
import { HeroPanel, ScreenHeader, SectionBlock, StatRow, VisualCard } from '../../src/ui/lived-in';
import { TicketStubArt } from '../../src/ui/pictograms';
import { Screen } from '../../src/ui/screen';

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
    <Screen>
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
              subtitle={ticket.status === 'valid' ? 'Ouvert' : ticket.status === 'used' ? 'Passe' : 'Annulé'}
              meta={`${ticket.event.title} • ${ticket.gate ?? 'Sans porte'}`}
              badge={ticket.code}
              onPress={() => router.push(`/(organizer)/tickets/${ticket.id}` as never)}
              right={
                <View style={styles.icons}>
                  <CalendarIcon size={14} color={colors.orangeInk} />
                  <MapIcon size={14} color={colors.orangeInk} />
                </View>
              }
            />
          ))}
        </View>
      </SectionBlock>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  icons: { gap: 8, paddingRight: 4 },
});
