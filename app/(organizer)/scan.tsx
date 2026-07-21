import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, Vibration } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { colors } from '../../src/theme/colors';
import { organizerColors } from '../../src/theme/organizer';
import { typography } from '../../src/theme/typography';
import { ClipboardIcon, CloseIcon, SparkIcon, TicketIcon, UserIcon } from '../../src/icons';
import { useAuth } from '../../src/auth';
import {
  FALLBACK_TICKETS,
  getOrganizerScanStats,
  scanOrganizerTicket,
  type BackendOrganizerScanStats,
  type BackendOrganizerTicketScanResult,
} from '../../src/backend';
import { buildAttendanceTierCards } from '../../src/organizer/scan-attendance';
import { shouldUseFallbackScanStats } from '../../src/organizer/scan-stats';
import { buildScanValidationDetails, type ScanValidationDetails } from '../../src/organizer/scan-validation';
import { REFRESH, useLiveRefresh } from '../../src/live-refresh';
import { Pictogram, StatusSeal } from '../../src/ui/pictograms';
import { SpeakButton } from '../../src/ui/speak-button';
import { getScanOutcomeVisual } from '../../src/ui/visual-language';
import { Screen } from '../../src/ui/screen';

const GATE_OPTIONS = ['Entrée principale', 'Entrée nord', 'Entrée sud', 'Entrée ouest', 'Entrée VIP'];

export default function OrganizerScan() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<BackendOrganizerScanStats>({
    pending: 0,
    queued: 0,
    scans: 0,
    totalTickets: 0,
    validTickets: 0,
    usedTickets: 0,
    byTier: [],
  });
  const [permissions, requestPermission] = useCameraPermissions();
  const [scannerActive, setScannerActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [gate, setGate] = useState(GATE_OPTIONS[0]);
  const [lastResult, setLastResult] = useState<BackendOrganizerTicketScanResult | null>(null);
  const [feedback, setFeedback] = useState('Prêt');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refreshTick = useLiveRefresh(REFRESH.live);

  useEffect(() => {
    if (!user) {
      return;
    }

    let disposed = false;
    const fallbackTickets = FALLBACK_TICKETS.filter((ticket) => ticket.event.organizerId === user.id);
    const fallbackQueued = fallbackTickets.length;
    const validTickets = fallbackTickets.filter((ticket) => ticket.status === 'valid').length;
    const usedTickets = fallbackTickets.filter((ticket) => ticket.status === 'used').length;
    const fallbackStats: BackendOrganizerScanStats = {
      pending: validTickets,
      queued: fallbackQueued,
      scans: fallbackTickets.length > 0 ? Math.round((usedTickets / fallbackTickets.length) * 100) : 0,
      totalTickets: fallbackTickets.length,
      validTickets,
      usedTickets,
      byTier: [
        {
          tierKey: 'standard',
          tierName: 'Standard',
          totalTickets: fallbackTickets.length,
          scannedTickets: usedTickets,
          pendingTickets: validTickets,
          cancelledTickets: fallbackTickets.filter((ticket) => ticket.status === 'cancelled').length,
        },
      ],
    };

    if (shouldUseFallbackScanStats(token ?? undefined)) {
      setStats(fallbackStats);
    }

    void getOrganizerScanStats(token ?? undefined, user.id).then((nextStats) => {
      if (!disposed) {
        setStats(nextStats);
      }
    });

    return () => {
      disposed = true;
    };
  }, [refreshTick, token, user]);

  const attendanceCards = buildAttendanceTierCards(stats);
  const cancelledTickets = Math.max(stats.totalTickets - stats.usedTickets - stats.validTickets, 0);
  const summaryTiles = useMemo(
    () => [
      {
        key: 'inside',
        icon: <UserIcon size={18} color={organizerColors.success} />,
        value: String(stats.usedTickets),
        label: 'Entrés',
        tone: 'success' as const,
      },
      {
        key: 'waiting',
        icon: <ClipboardIcon size={18} color={colors.orangeInk} />,
        value: String(stats.pending),
        label: 'Attente',
        tone: 'warning' as const,
      },
      {
        key: 'blocked',
        icon: <CloseIcon size={18} color={colors.red} />,
        value: String(cancelledTickets),
        label: 'Bloqués',
        tone: 'danger' as const,
      },
    ],
    [cancelledTickets, stats.pending, stats.usedTickets],
  );

  async function submitScan(code: string, source: 'qr' | 'manual') {
    if (isSubmitting || !code.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await scanOrganizerTicket(token ?? undefined, code, gate, source);
      setLastResult(result);

      switch (result?.outcome) {
        case 'checked_in':
          Vibration.vibrate(50);
          setFeedback(`${result.ticket?.holderName ?? 'OK'} entre`);
          setManualCode('');
          setScannerActive(false);
          break;
        case 'already_used':
          Vibration.vibrate([50, 100, 50]);
          setFeedback('Déjà scanné');
          setScannerActive(false);
          break;
        case 'cancelled':
          Vibration.vibrate([50, 100, 50]);
          setFeedback('Billet bloque');
          setScannerActive(false);
          break;
        default:
          Vibration.vibrate([50, 100, 50]);
          setFeedback('Introuvable');
          setScannerActive(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStartScanner() {
    if (!permissions?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        setFeedback('Camera bloquee');
        return;
      }
    }

    setScannerActive(true);
    setFeedback('Vise le QR');
  }

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (!scannerActive || isSubmitting) {
      return;
    }

    await submitScan(result.data, 'qr');
  }

  const resultVisual = lastResult ? getScanOutcomeVisual(lastResult.outcome) : null;
  const validationDetails: ScanValidationDetails | null =
    lastResult?.scan && lastResult.ticket
      ? buildScanValidationDetails({ audit: lastResult.scan, ticket: lastResult.ticket })
      : null;

  async function handleNextScan() {
    setLastResult(null);
    setFeedback('Vise le QR');
    setScannerActive(true);
  }

  return (
    <Screen>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Pictogram pictogram="scan" tone="green" size={44} />
            <Text style={styles.heroBadgeText}>SCANNER</Text>
          </View>
          <View style={[styles.liveChip, scannerActive && styles.liveChipActive]}>
            <View style={[styles.liveDot, scannerActive && styles.liveDotActive]} />
            <Text style={[styles.liveChipText, scannerActive && styles.liveChipTextActive]}>
              {scannerActive ? 'EN DIRECT' : 'PRÊT'}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>Entree rapide</Text>
        <Text style={styles.subline}>QR d'abord, code si besoin.</Text>
        <SpeakButton instruction="Place le code QR au centre du cadre. Si le scan échoue, entre le code du billet." label="Mode d'emploi" />

        <View style={styles.scanFrame}>
          {scannerActive ? (
            <CameraView
              active={scannerActive}
              style={styles.camera}
              facing="back"
              enableTorch={torchOn}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <View style={styles.cameraIconShell}><Pictogram pictogram="scan" tone="green" size={152} label="Scanner un code QR" /></View>
              <View style={styles.cameraHintRow}>
                <SparkIcon size={16} color={colors.orangeInk} />
                <Text style={styles.placeholderText}>{feedback}</Text>
              </View>
            </View>
          )}

          <Pressable accessibilityRole="button" accessibilityLabel={torchOn ? 'Éteindre la lampe' : 'Allumer la lampe'} accessibilityState={{ checked: torchOn }} style={styles.torchButton} onPress={() => setTorchOn(!torchOn)}>
            <SparkIcon size={16} color={torchOn ? colors.orange : organizerColors.text} />
          </Pressable>
        </View>

        <View style={styles.primaryActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir le scanner" accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }} style={[styles.bigAction, styles.bigActionPrimary, isSubmitting && styles.actionDisabled]} onPress={handleStartScanner} disabled={isSubmitting}>
            <Pictogram pictogram="scan" tone="green" size={48} />
            <Text style={styles.bigActionPrimaryText}>{scannerActive ? 'CAMÉRA OUVERTE' : 'SCANNER'}</Text>
          </Pressable>

          <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir les billets" style={styles.bigAction} onPress={() => router.push('/(organizer)/tickets' as never)}>
            <TicketIcon size={18} color={organizerColors.text} />
            <Text style={styles.bigActionText}>Billets</Text>
          </Pressable>
        </View>
      </View>

      {validationDetails ? (
        <View style={[styles.validationCard, validationDetails.outcome === 'checked_in' ? styles.validationCardSuccess : styles.validationCardWarning]}>
          <View style={styles.validationHeader}>
            <StatusSeal pictogram={resultVisual?.key ?? 'history'} tone={resultVisual?.tone ?? 'yellow'} label={resultVisual?.label ?? 'SCAN'} hint={resultVisual?.hint} size={92} />
            <View style={styles.validationHeaderBody}>
              <Text style={styles.validationEyebrow}>Validation de passage</Text>
              <Text style={styles.validationTitle}>{validationDetails.holderName}</Text>
              <Text style={styles.validationCode}>{validationDetails.code}</Text>
            </View>
          </View>

          <View style={styles.validationGrid}>
            <ValidationRow label="Événement" value={validationDetails.eventTitle} />
            <ValidationRow label="Date de l'événement" value={validationDetails.eventDate} />
            <ValidationRow label="Lieu de l'événement" value={validationDetails.eventLocation} />
            <ValidationRow label="Organisateur" value={validationDetails.eventOrganizer} />
            <ValidationRow label="Place / catégorie" value={`${validationDetails.seat} · ${validationDetails.ticketTier}`} />
            <ValidationRow label="Montant du billet" value={validationDetails.pricePaidLabel} />
            <ValidationRow label="Porte / lieu du scan" value={validationDetails.gate} />
            <ValidationRow label="Jour et heure" value={validationDetails.scannedAtLabel} />
            <ValidationRow label="Heure serveur exacte" value={validationDetails.scannedAtIso} />
            <ValidationRow label="Scanné par" value={`${validationDetails.scannerName} · ${validationDetails.scannerRole}`} />
            <ValidationRow label="Source" value={validationDetails.sourceLabel} />
            <ValidationRow label="Identifiant de contrôle" value={validationDetails.auditId} />
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Scanner le billet suivant" style={styles.nextScanAction} onPress={() => void handleNextScan()}>
            <Pictogram pictogram="scan" tone="green" size={26} />
            <Text style={styles.nextScanActionText}>Scanner le billet suivant</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.summaryRow}>
        {summaryTiles.map((tile) => (
          <SummaryTile key={tile.key} icon={tile.icon} value={tile.value} label={tile.label} tone={tile.tone} />
        ))}
      </View>

      <View style={styles.attendanceCard}>
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionEyebrow}>Dans la salle</Text>
            <Text style={styles.sectionTitle}>{stats.usedTickets} / {stats.totalTickets}</Text>
          </View>
          <View style={styles.scanRatePill}>
            <SparkIcon size={12} color={colors.orangeInk} />
            <Text style={styles.scanRateText}>{stats.scans}%</Text>
          </View>
        </View>

        <View style={styles.tierList}>
          {attendanceCards.map((tier) => {
            const barWidth = `${Math.max(tier.scanRate, tier.total > 0 ? 8 : 0)}%` as const;
            const isVip = tier.key.toLowerCase().includes('vip');
            return (
              <View key={tier.key} style={styles.tierCard}>
                <View style={styles.tierTopRow}>
                  <View style={styles.tierLead}>
                    <View style={[styles.tierIconShell, isVip && styles.tierIconShellVip]}>
                      {isVip ? (
                        <SparkIcon size={16} color={isVip ? colors.black : colors.orange} />
                      ) : (
                        <TicketIcon size={16} color={colors.orangeInk} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.tierName}>{tier.name}</Text>
                      <Text style={styles.tierMeta}>
                        {tier.checkedIn} / {tier.total}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.tierRate}>{tier.scanRate}%</Text>
                </View>

                <View style={styles.tierTrack}>
                  <View style={[styles.tierFill, { width: barWidth }]} />
                </View>

                <View style={styles.tierCounts}>
                  <MiniCount icon={<ClipboardIcon size={12} color={colors.orangeInk} />} value={tier.waiting} />
                  <MiniCount icon={<CloseIcon size={12} color={colors.red} />} value={tier.cancelled} />
                  <MiniCount icon={<UserIcon size={12} color={organizerColors.success} />} value={tier.checkedIn} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.gateCard}>
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionEyebrow}>Porte</Text>
            <Text style={styles.sectionTitleSmall}>{gate}</Text>
          </View>
          <Text style={styles.sectionMeta}>{stats.queued} en attente</Text>
        </View>

        <View style={styles.gateChips}>
          {GATE_OPTIONS.map((option) => {
            const active = gate === option;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={`Porte ${option}`} accessibilityState={{ selected: active }} key={option} style={[styles.gateChip, active && styles.gateChipActive]} onPress={() => setGate(option)}>
                <Text style={[styles.gateChipText, active && styles.gateChipTextActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.manualCard}>
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionEyebrow}>Code</Text>
            <Text style={styles.sectionTitleSmall}>Entrer le billet</Text>
          </View>
          <View style={styles.feedbackChip}>
            <Text style={styles.feedbackChipText}>{feedback}</Text>
          </View>
        </View>

        <TextInput
          style={styles.manualInput}
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="YT-2026-004"
          placeholderTextColor={organizerColors.textMuted}
          autoCorrect={false}
          autoCapitalize="characters"
        />

        <Pressable accessibilityRole="button" accessibilityLabel="Valider le code du billet" accessibilityState={{ disabled: !manualCode.trim() || isSubmitting, busy: isSubmitting }}
          style={[styles.submitAction, (!manualCode.trim() || isSubmitting) && styles.actionDisabled]}
          onPress={() => void submitScan(manualCode, 'manual')}
          disabled={!manualCode.trim() || isSubmitting}
        >
          <TicketIcon size={16} color={colors.black} />
          <Text style={styles.submitActionText}>{isSubmitting ? '...' : 'Verifier'}</Text>
        </Pressable>
      </View>

      {lastResult && resultVisual && !validationDetails ? (
        <View
          style={[
            styles.resultCard,
            lastResult.outcome === 'checked_in'
              ? styles.resultCardSuccess
              : lastResult.outcome === 'cancelled'
                ? styles.resultCardDanger
                : styles.resultCardWarning,
          ]}
        >
          <View style={styles.resultTopRow}>
            <StatusSeal pictogram={resultVisual.key} tone={resultVisual.tone} label={resultVisual.label} hint={resultVisual.hint} size={104} />
            <View style={styles.resultBody}>
              <Text style={styles.resultTitle}>{lastResult.ticket?.holderName ?? 'Billet inconnu'}</Text>
              <Text style={styles.resultMeta}>{lastResult.ticket?.code ?? 'Entrer le code à la main'}</Text>
            </View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function SummaryTile({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: 'success' | 'warning' | 'danger';
}) {
  return (
    <View
      style={[
        styles.summaryTile,
        tone === 'success' ? styles.summaryTileSuccess : tone === 'warning' ? styles.summaryTileWarning : styles.summaryTileDanger,
      ]}
    >
      <View style={styles.summaryIcon}>{icon}</View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function MiniCount({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <View style={styles.miniCount}>
      {icon}
      <Text style={styles.miniCountText}>{value}</Text>
    </View>
  );
}

function ValidationRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.validationRow}>
      <Text style={styles.validationLabel}>{label}</Text>
      <Text style={styles.validationValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdropOrbA: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: 'rgba(242,100,59,0.14)',
  },
  backdropOrbB: {
    position: 'absolute',
    bottom: 120,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 140,
    backgroundColor: 'rgba(255,197,22,0.10)',
  },
  heroCard: {
    gap: 14,
    padding: 18,
    borderRadius: 28,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: organizerColors.warningSoft,
  },
  heroBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: organizerColors.surfaceAlt,
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  liveChipActive: {
    backgroundColor: organizerColors.successSoft,
    borderColor: organizerColors.success,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: organizerColors.textMuted,
  },
  liveDotActive: {
    backgroundColor: organizerColors.success,
  },
  liveChipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textSecondary,
    letterSpacing: 1.1,
  },
  liveChipTextActive: {
    color: organizerColors.success,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    lineHeight: 34,
    color: organizerColors.text,
  },
  subline: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: organizerColors.textSecondary,
  },
  scanFrame: {
    minHeight: 300,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: organizerColors.surfaceAlt,
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  camera: {
    width: '100%',
    minHeight: 300,
  },
  cameraPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  cameraIconShell: {
    width: 172,
    height: 172,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,249,244,0.86)',
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  cameraHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: organizerColors.surface,
  },
  placeholderText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: organizerColors.text,
  },
  torchButton: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,249,244,0.92)',
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  primaryActions: { flexDirection: 'row', gap: 10 },
  bigAction: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: organizerColors.surfaceAlt,
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  bigActionPrimary: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  bigActionText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: organizerColors.text,
  },
  bigActionPrimaryText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.black,
  },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryTile: {
    flex: 1,
    gap: 8,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  summaryTileSuccess: {
    backgroundColor: organizerColors.successSoft,
    borderColor: organizerColors.success,
  },
  summaryTileWarning: {
    backgroundColor: organizerColors.warningSoft,
    borderColor: colors.orange,
  },
  summaryTileDanger: {
    backgroundColor: 'rgba(215,31,39,0.08)',
    borderColor: 'rgba(215,31,39,0.18)',
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: organizerColors.surface,
  },
  summaryValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 26,
    color: organizerColors.text,
  },
  summaryLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  attendanceCard: {
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
  },
  gateCard: {
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
  },
  manualCard: {
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionEyebrow: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    marginTop: 3,
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    color: organizerColors.text,
  },
  sectionTitleSmall: {
    marginTop: 3,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: organizerColors.text,
  },
  sectionMeta: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: organizerColors.textMuted,
  },
  scanRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: organizerColors.warningSoft,
  },
  scanRateText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.orangeInk,
  },
  tierList: { gap: 10 },
  tierCard: {
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: organizerColors.background,
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  tierTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  tierLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierIconShell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: organizerColors.surface,
  },
  tierIconShellVip: {
    backgroundColor: colors.orange,
  },
  tierName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: organizerColors.text,
  },
  tierMeta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textSecondary,
  },
  tierRate: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: colors.orangeInk,
  },
  tierTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: organizerColors.surfaceStrong,
  },
  tierFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.orange,
  },
  tierCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  miniCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: organizerColors.surface,
  },
  miniCountText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: organizerColors.text,
  },
  gateChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gateChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: organizerColors.surfaceAlt,
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  gateChipActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  gateChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: organizerColors.text,
  },
  gateChipTextActive: {
    color: colors.black,
  },
  feedbackChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: organizerColors.surfaceAlt,
  },
  feedbackChipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: organizerColors.text,
  },
  manualInput: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
    backgroundColor: organizerColors.background,
    paddingHorizontal: 16,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: organizerColors.text,
  },
  submitAction: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: colors.orange,
  },
  submitActionText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.black,
  },
  resultCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  resultCardSuccess: {
    backgroundColor: organizerColors.successSoft,
    borderColor: organizerColors.success,
  },
  resultCardWarning: {
    backgroundColor: organizerColors.warningSoft,
    borderColor: colors.orange,
  },
  resultCardDanger: {
    backgroundColor: 'rgba(215,31,39,0.08)',
    borderColor: 'rgba(215,31,39,0.18)',
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultIconShell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: organizerColors.surface,
  },
  resultBody: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: organizerColors.text,
  },
  resultMeta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textSecondary,
  },
  resultStatus: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: organizerColors.text,
    letterSpacing: 1.1,
  },
  validationCard: {
    gap: 16,
    padding: 18,
    borderRadius: 28,
    borderWidth: 2,
  },
  validationCardSuccess: {
    backgroundColor: organizerColors.successSoft,
    borderColor: organizerColors.success,
  },
  validationCardWarning: {
    backgroundColor: organizerColors.warningSoft,
    borderColor: colors.orange,
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  validationHeaderBody: {
    flex: 1,
    gap: 3,
  },
  validationEyebrow: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  validationTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: organizerColors.text,
  },
  validationCode: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: organizerColors.textSecondary,
    letterSpacing: 0.8,
  },
  validationGrid: {
    gap: 9,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,249,244,0.72)',
  },
  validationRow: {
    gap: 2,
  },
  validationLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  validationValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: organizerColors.text,
  },
  nextScanAction: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: colors.orange,
  },
  nextScanActionText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.black,
  },
  actionDisabled: {
    opacity: 0.65,
  },
});
