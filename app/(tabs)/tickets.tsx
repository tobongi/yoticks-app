import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const TICKETS = [
  { id: '1', event: 'Kinshasa Jazz Festival', date: '15 Juin 2026', location: 'Kinshasa, RDC', status: 'valid', seat: 'A-12', code: 'YT-2026-001' },
  { id: '2', event: 'Africa CEO Forum', date: '22 Juin 2026', location: 'Abidjan, CI', status: 'valid', seat: 'VIP', code: 'YT-2026-002' },
  { id: '3', event: 'Nuit Funk 2026', date: '3 Avr 2026', location: 'Kinshasa, RDC', status: 'used', seat: 'B-07', code: 'YT-2026-000' },
];

const statusConfig = {
  valid: { label: 'Valide', color: colors.green, bg: colors.green + '22' },
  used: { label: 'Utilisé', color: colors.textMuted, bg: colors.cardHover },
  cancelled: { label: 'Annulé', color: colors.red, bg: colors.red + '22' },
};

export default function Tickets() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Mes billets</Text>

        {TICKETS.map((ticket) => {
          const status = statusConfig[ticket.status as keyof typeof statusConfig];
          return (
            <Pressable key={ticket.id} style={styles.ticket} onPress={() => router.push(`/ticket/${ticket.id}`)}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketEvent}>{ticket.event}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.ticketDivider} />

              <View style={styles.ticketMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Date</Text>
                  <Text style={styles.metaValue}>{ticket.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Lieu</Text>
                  <Text style={styles.metaValue}>{ticket.location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Place</Text>
                  <Text style={styles.metaValue}>{ticket.seat}</Text>
                </View>
              </View>

              <View style={styles.ticketCode}>
                <Text style={styles.codeText}>{ticket.code}</Text>
                {ticket.status === 'valid' && <Text style={styles.scanText}>Appuyer pour scanner →</Text>}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  pageTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], color: colors.text, marginBottom: 24 },
  ticket: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, gap: 12 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  ticketEvent: { flex: 1, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md, color: colors.text, lineHeight: 24 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs },
  ticketDivider: { height: 1, backgroundColor: colors.border },
  ticketMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flex: 1, gap: 4 },
  metaLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textMuted },
  metaValue: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.text },
  ticketCode: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.cardHover, borderRadius: 8, padding: 12 },
  codeText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orange, letterSpacing: 1 },
  scanText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textMuted },
});
