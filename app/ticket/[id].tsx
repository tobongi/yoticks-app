import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const TICKETS: Record<string, any> = {
  '1': { event: 'Kinshasa Jazz Festival', date: '15 Juin 2026', time: '19h00', location: 'Stade des Martyrs, Kinshasa', seat: 'A-12', holder: 'Jean Dupont', code: 'YT-2026-001', status: 'valid' },
  '2': { event: 'Africa CEO Forum', date: '22 Juin 2026', time: '08h30', location: 'Hôtel Ivoire, Abidjan', seat: 'VIP', holder: 'Jean Dupont', code: 'YT-2026-002', status: 'valid' },
  '3': { event: 'Nuit Funk 2026', date: '3 Avr 2026', time: '22h00', location: 'Club Fréquence, Kinshasa', seat: 'B-07', holder: 'Jean Dupont', code: 'YT-2026-000', status: 'used' },
};

export default function TicketModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticket = TICKETS[id] ?? TICKETS['1'];
  const isValid = ticket.status === 'valid';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.close} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <View style={[styles.ticket, !isValid && styles.ticketUsed]}>
          {/* Header */}
          <View style={styles.ticketHeader}>
            <Text style={styles.brandLogo}>YOTICKS</Text>
            <View style={[styles.statusDot, { backgroundColor: isValid ? colors.green : colors.textMuted }]} />
          </View>

          <Text style={styles.eventTitle}>{ticket.event}</Text>

          {/* Info grid */}
          <View style={styles.infoGrid}>
            {[
              { label: 'Date', value: ticket.date },
              { label: 'Heure', value: ticket.time },
              { label: 'Lieu', value: ticket.location },
              { label: 'Place', value: ticket.seat },
              { label: 'Titulaire', value: ticket.holder },
            ].map((row) => (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* QR placeholder */}
          <View style={styles.divider}>
            <View style={styles.dividerCircle} />
            <View style={styles.dividerLine} />
            <View style={[styles.dividerCircle, styles.dividerCircleRight]} />
          </View>

          <View style={styles.qrSection}>
            <View style={[styles.qrCode, !isValid && styles.qrCodeUsed]}>
              <Text style={styles.qrText}>▦</Text>
              {!isValid && <View style={styles.qrOverlay}><Text style={styles.qrOverlayText}>UTILISÉ</Text></View>}
            </View>
            <Text style={styles.ticketCode}>{ticket.code}</Text>
            <Text style={styles.scanHint}>{isValid ? 'Présentez ce QR code à l\'entrée' : 'Ce billet a déjà été utilisé'}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, alignItems: 'center' },
  close: { alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  closeText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.text },
  ticket: { width: '100%', backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderOrange },
  ticketUsed: { borderColor: colors.border, opacity: 0.7 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 4 },
  brandLogo: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xs, color: colors.orange, letterSpacing: 3 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  eventTitle: { paddingHorizontal: 20, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text, lineHeight: 30, marginBottom: 20 },
  infoGrid: { paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textMuted },
  infoValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.bg, marginLeft: -10 },
  dividerCircleRight: { marginLeft: 'auto', marginRight: -10 },
  dividerLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border },
  qrSection: { paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center', gap: 12 },
  qrCode: { width: 160, height: 160, backgroundColor: colors.bg, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qrCodeUsed: { opacity: 0.4 },
  qrText: { fontSize: 100, color: colors.text },
  qrOverlay: { position: 'absolute', inset: 0, backgroundColor: colors.bg + 'cc', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  qrOverlayText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.textMuted, letterSpacing: 3 },
  ticketCode: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base, color: colors.orange, letterSpacing: 2 },
  scanHint: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
});
