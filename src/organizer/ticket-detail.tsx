import { useEffect, useState } from 'react';
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import {
  FALLBACK_TICKETS,
  getOrganizerTicket,
  updateOrganizerTicket,
  type BackendTicket,
  type BackendUpdateTicketInput,
} from '../backend';
import { useAuth } from '../auth';
import { CalendarIcon, ClipboardIcon, MapIcon, UserIcon } from '../icons';
import { REFRESH, useLiveRefresh } from '../live-refresh';
import { Chip, HeroPanel, LivedBackground, ScreenHeader, SectionBlock, StatRow } from '../ui/lived-in';
import { TicketStubArt } from '../ui/pictograms';
import { usePhoneLayout } from '../ui/responsive';
import { ImageScrim } from '../ui/image-scrim';

type TicketStatusOption = BackendTicket['status'];

const STATUS_OPTIONS: TicketStatusOption[] = ['valid', 'used', 'cancelled'];

function formatStatusLabel(status: TicketStatusOption) {
  switch (status) {
    case 'valid':
      return 'Ouvert';
    case 'used':
      return 'Passe';
    case 'cancelled':
      return 'Annulé';
  }
}

export function OrganizerTicketDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, token } = useAuth();
  const [ticket, setTicket] = useState<BackendTicket | null>(null);
  const [draftStatus, setDraftStatus] = useState<TicketStatusOption>('valid');
  const [draftGate, setDraftGate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const refreshTick = useLiveRefresh(REFRESH.normal);
  const layout = usePhoneLayout();

  useEffect(() => {
    if (!user || typeof id !== 'string' || !id.trim()) {
      setTicket(null);
      return;
    }
    const fallback = FALLBACK_TICKETS.filter((entry) => entry.event.organizerId === user.id).find((entry) => entry.id === id) ?? null;
    setTicket(fallback);
    getOrganizerTicket(token ?? undefined, user.id, id).then(setTicket);
  }, [refreshTick, token, user, id]);

  useEffect(() => {
    if (!ticket) {
      return;
    }
    setDraftStatus(ticket.status);
    setDraftGate(ticket.gate ?? '');
  }, [ticket]);

  async function handleSave() {
    if (!ticket) {
      return;
    }

    setIsSaving(true);
    try {
      const input: BackendUpdateTicketInput = { status: draftStatus, gate: draftGate.trim() || null };
      const updated = await updateOrganizerTicket(token ?? undefined, ticket.id, input);
      if (!updated) {
        throw new Error('Mise a jour impossible');
      }
      setTicket(updated);
      Alert.alert('Billet', 'Etat et porte mis a jour.');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur inattendue');
    } finally {
      setIsSaving(false);
    }
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LivedBackground />
        <View style={styles.emptyState}>
          <Text style={styles.kicker}>Billet</Text>
          <Text style={styles.emptyTitle}>Introuvable</Text>
          <Text style={styles.emptyCopy}>Ce billet n'est pas dans ton espace.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour aux billets" style={styles.primaryButton} onPress={() => router.replace('/(organizer)/tickets')}>
            <Text style={styles.primaryButtonText}>Retour billets</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingHorizontal: layout.screenPadding, paddingBottom: layout.isCompact ? 96 : 110, gap: layout.sectionGap }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="Billet" title={ticket.holderName} />

        <ImageBackground source={{ uri: ticket.event.imageUrl }} style={styles.cover} imageStyle={styles.coverInner}>
          <ImageScrim id="ticket-cover" />
          <View style={styles.coverTop}>
            <Text style={styles.coverChip}>{formatStatusLabel(draftStatus)}</Text>
            <Text style={styles.coverChip}>{ticket.code}</Text>
          </View>
          <Text style={styles.coverTitle}>{ticket.event.title}</Text>
          <Text style={styles.coverMeta}>{ticket.event.location} • {ticket.event.date}</Text>
        </ImageBackground>

        <HeroPanel eyebrow="Porte" title="Contrôle rapide" subtitle="Code • place • état" art={<TicketStubArt tone="green" size={92} />}>
          <StatRow
            items={[
              { label: 'Code', value: ticket.code },
              { label: 'Place', value: ticket.seat },
              { label: 'Porte', value: draftGate.trim() || '-' },
            ]}
          />
        </HeroPanel>

        <SectionBlock eyebrow="Action" title="Etat">
          <View style={styles.chipWrap}>
            {STATUS_OPTIONS.map((status) => (
              <Chip key={status} label={formatStatusLabel(status)} active={draftStatus === status} onPress={() => setDraftStatus(status)} />
            ))}
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Porte</Text>
            <TextInput
              accessibilityLabel="Porte"
              style={styles.input}
              value={draftGate}
              onChangeText={setDraftGate}
              placeholder="Main Gate"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
            />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Enregistrer le billet" accessibilityState={{ disabled: isSaving, busy: isSaving }} style={[styles.primaryButton, isSaving && styles.buttonDisabled]} onPress={handleSave} disabled={isSaving}>
            <Text style={styles.primaryButtonText}>{isSaving ? 'Sauvegarde...' : 'Sauver'}</Text>
          </Pressable>
        </SectionBlock>

        <SectionBlock eyebrow="Sortie" title="Contexte">
          <View style={styles.infoGrid}>
            <InfoTile icon={<CalendarIcon size={16} color={colors.orangeInk} />} label="Date" value={ticket.event.date} width={layout.twoUpWidth} />
            <InfoTile icon={<MapIcon size={16} color={colors.orangeInk} />} label="Lieu" value={ticket.event.location} width={layout.twoUpWidth} />
            <InfoTile icon={<UserIcon size={16} color={colors.orangeInk} />} label="Orga" value={ticket.event.organizer} width={layout.twoUpWidth} />
            <InfoTile icon={<ClipboardIcon size={16} color={colors.orangeInk} />} label="Etat" value={formatStatusLabel(draftStatus)} width={layout.twoUpWidth} />
          </View>
        </SectionBlock>

        <SectionBlock eyebrow="Porte" title="Rappel equipe">
          <View style={styles.noteCard}>
            <Text style={styles.noteLine}>Verifier le QR puis la porte.</Text>
            <Text style={styles.noteLine}>Changer l'etat seulement si besoin reel.</Text>
            <Text style={styles.noteLine}>Garder la correction courte et lisible.</Text>
          </View>
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
  emptyState: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 12 },
  kicker: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.8 },
  emptyTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], color: colors.text },
  emptyCopy: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.textSecondary },
  cover: { minHeight: 220, borderRadius: 28, overflow: 'hidden', padding: 16, justifyContent: 'flex-end', gap: 8 },
  coverInner: { borderRadius: 28 },
  coverTop: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  coverChip: { borderRadius: 999, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.88)', fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  coverTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], lineHeight: 34, color: colors.ivory },
  coverMeta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.beige },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { gap: 8, marginTop: 12 },
  fieldLabel: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  primaryButton: { minHeight: 52, borderRadius: 18, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 12 },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.black },
  buttonDisabled: { opacity: 0.7 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoTile: { borderRadius: 22, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 8 },
  infoIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  infoValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  noteCard: { borderRadius: 24, padding: 18, backgroundColor: colors.black, gap: 8 },
  noteLine: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.ivory },
});
