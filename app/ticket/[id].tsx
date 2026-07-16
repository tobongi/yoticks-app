import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { FALLBACK_TICKETS, getTicket, type BackendTicket } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { useLiveRefresh } from '../../src/live-refresh';
import { ArrowLeftIcon, CloseIcon } from '../../src/icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { HeroPanel, LivedBackground, SectionBlock, StatRow } from '../../src/ui/lived-in';
import { usePhoneLayout } from '../../src/ui/responsive';
import { Pictogram, PictogramLabel, StatusSeal } from '../../src/ui/pictograms';
import { getTicketVisual } from '../../src/ui/visual-language';
import { SpeakButton } from '../../src/ui/speak-button';

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [ticket, setTicket] = useState<BackendTicket | null>(null);
  const [expanded, setExpanded] = useState(false);
  const refreshTick = useLiveRefresh(2500);
  const scanLine = useRef(new Animated.Value(0)).current;
  const layout = usePhoneLayout();

  useEffect(() => {
    getTicket(id, token ?? undefined).then((next) => setTicket(next ?? FALLBACK_TICKETS[0]));
  }, [id, refreshTick, token]);

  useEffect(() => {
    if (!expanded) {
      scanLine.setValue(0);
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 210, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
  }, [expanded, scanLine]);

  const current = ticket ?? FALLBACK_TICKETS[0];
  const valid = current.status === 'valid';
  const ticketVisual = getTicketVisual(current.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <Modal visible={expanded} transparent animationType="fade" onRequestClose={() => setExpanded(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer le QR agrandi" style={styles.modalScrim} onPress={() => setExpanded(false)} />
          <View style={[styles.modalCard, { maxWidth: layout.modalCardWidth }]}>
            <View style={styles.modalTop}>
              <View>
                <Text style={styles.modalEyebrow}>{current.event.title}</Text>
                <Text style={styles.modalTitle}>{current.code}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fermer le QR agrandi" style={styles.modalClose} onPress={() => setExpanded(false)}>
                <CloseIcon size={16} color={colors.text} />
              </Pressable>
            </View>
            <View style={styles.qrFrameLarge}>
              <QRCode value={`yoticks-ticket:${current.code}|event:${current.event.id}|seat:${current.seat}`} size={layout.qrSizeLarge} backgroundColor={colors.bg} color={colors.text} />
              {valid ? <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLine }] }]} /> : <Text style={styles.usedStamp}>UTILISÉ</Text>}
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingHorizontal: layout.screenPadding, paddingBottom: layout.isCompact ? 96 : 110, gap: layout.sectionGap }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Retour aux billets" style={styles.back} onPress={() => router.replace('/(tabs)/tickets')}>
          <ArrowLeftIcon size={16} color={colors.orange} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>

        <HeroPanel eyebrow={ticketVisual.label} title={current.event.title} subtitle={`${current.event.location} • ${current.event.date}`} tone={ticketVisual.tone} art={<StatusSeal pictogram={ticketVisual.key} tone={ticketVisual.tone} label={ticketVisual.label} hint={ticketVisual.hint} size={68} />}>
          <StatRow items={[{ label: 'Code', value: current.code }, { label: 'Place', value: current.seat }, { label: 'Porte', value: current.gate ?? '-' }]} />
          <Pressable accessibilityRole="button" accessibilityLabel="Agrandir mon code QR" accessibilityState={{ disabled: !valid }} style={styles.qrCard} onPress={() => setExpanded(true)}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrLabel}>Mon QR</Text>
              <Text style={styles.qrHint}>{valid ? 'Toucher pour agrandir' : 'Deja scanne'}</Text>
            </View>
            <View style={styles.qrFrameSmall}>
              <QRCode value={`yoticks-ticket:${current.code}|event:${current.event.id}|seat:${current.seat}`} size={layout.qrSizeSmall} backgroundColor={colors.card} color={colors.text} />
              {!valid ? <Text style={styles.usedStampSmall}>UTILISÉ</Text> : null}
            </View>
          </Pressable>
        </HeroPanel>

        <SectionBlock eyebrow="Infos" title="A garder">
          <View style={styles.infoGrid}>
            <InfoTile icon={<Pictogram pictogram="history" size={38} />} label="Date" value={current.event.date} width={layout.twoUpWidth} />
            <InfoTile icon={<Pictogram pictogram="map" tone="yellow" size={38} />} label="Lieu" value={current.event.location} width={layout.twoUpWidth} />
            <InfoTile icon={<Pictogram pictogram="profile" tone="blue" size={38} />} label="Nom" value={current.holderName} width={layout.twoUpWidth} />
            <InfoTile icon={<Pictogram pictogram={ticketVisual.key} tone={ticketVisual.tone} size={38} />} label="Statut" value={ticketVisual.label} width={layout.twoUpWidth} />
          </View>
        </SectionBlock>

        <SectionBlock eyebrow="Rappel" title="Avant la porte">
          <View style={styles.noteCard}>
            <PictogramLabel pictogram="ticket" tone="orange" label="Ouvre" />
            <PictogramLabel pictogram="night" tone="yellow" label="Éclaire" />
            <PictogramLabel pictogram="scan" tone="green" label="Montre" />
          </View>
          <SpeakButton instruction="Ouvre ton billet, augmente la lumière de l'écran, puis montre le code QR à l'entrée." />
        </SectionBlock>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoTile({ icon, label, value, width }: { icon: React.ReactNode; label: string; value: string; width: '100%' | '48.5%' }) {
  return (
    <View style={[styles.infoTile, { width }]}>
      <View style={styles.infoIcon}>{icon}</View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1 },
  content: { paddingTop: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.orange },
  qrCard: { borderRadius: 24, padding: 14, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, gap: 12, alignItems: 'center' },
  qrHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  qrLabel: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  qrHint: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  qrFrameSmall: { minWidth: 160, minHeight: 160, padding: 14, borderRadius: 26, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  usedStampSmall: { position: 'absolute', fontFamily: typography.fontFamily.bold, fontSize: 26, color: colors.red, transform: [{ rotate: '-14deg' }] },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoTile: { borderRadius: 22, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 8 },
  infoIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  infoValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  noteCard: { borderRadius: 24, padding: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-around', gap: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(17,17,17,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalScrim: { ...StyleSheet.absoluteFill },
  modalCard: { width: '100%', borderRadius: 28, padding: 18, backgroundColor: colors.card, gap: 16 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalEyebrow: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  modalTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text },
  modalClose: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  qrFrameLarge: { alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 28, backgroundColor: colors.bgDeep, overflow: 'hidden' },
  scanLine: { position: 'absolute', left: 24, right: 24, height: 4, borderRadius: 999, backgroundColor: colors.orange },
  usedStamp: { position: 'absolute', fontFamily: typography.fontFamily.bold, fontSize: 36, color: colors.red, transform: [{ rotate: '-14deg' }] },
});
