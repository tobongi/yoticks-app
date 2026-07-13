import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { ArrowLeftIcon, ChevronRightIcon, ClipboardIcon, GlobeIcon, InfoIcon, TicketIcon } from '../src/icons';

type LinkCard = {
  key: string;
  label: string;
  helper: string;
  url: string;
  icon: 'globe' | 'ticket' | 'clipboard' | 'info';
};

type ClientCard = {
  name: string;
  tag: string;
  focus: string;
  note: string;
};

const DEMO_SITE = 'https://eventzv2.clonegranny.com/';
const PDF_URL = 'https://drive.google.com/file/d/1bv_7X6Nzx7ay7hHzXHYhCXqSNRsH2t0m/view';
const VIDEO_URL = 'https://vimeo.com/656864361';
const LANDING_URL = 'https://www.alphansotech.com/eventz';
const ANDROID_USER_URL = 'https://play.google.com/store/apps/details?id=com.eventzapp';
const ANDROID_ORGANIZER_URL = 'https://play.google.com/store/apps/details?id=com.eventz.organizer';
const IOS_ORGANIZER_URL = 'https://apps.apple.com/us/app/event-organizer-management/id1359592615';

const CLIENTS: ClientCard[] = [
  {
    name: 'Yotix',
    tag: 'Attendee journey',
    focus: 'Découverte, recherche et réservation rapide',
    note: 'Le cas le plus proche de YoTicks pour tout ce qui touche à la navigation, aux filtres et au ticket mobile.',
  },
  {
    name: 'Paytix',
    tag: 'Monetisation',
    focus: 'Réservations, paiements et suivi des billets',
    note: 'Utile pour valider les écrans liés au checkout, au statut de billet et au suivi post-achat.',
  },
];

const ACCESS_LINKS: LinkCard[] = [
  {
    key: 'site',
    label: 'Website demo',
    helper: 'Ouvre l’environnement de démonstration principal.',
    url: DEMO_SITE,
    icon: 'globe',
  },
  {
    key: 'android-user',
    label: 'Android app - User',
    helper: 'Version orientée découverte et réservation.',
    url: ANDROID_USER_URL,
    icon: 'ticket',
  },
  {
    key: 'android-organizer',
    label: 'Android app - Organizer',
    helper: 'Vue organisateur pour gérer les events.',
    url: ANDROID_ORGANIZER_URL,
    icon: 'clipboard',
  },
  {
    key: 'ios-organizer',
    label: 'iOS app - Organizer',
    helper: 'Même parcours, côté Apple.',
    url: IOS_ORGANIZER_URL,
    icon: 'info',
  },
];

const RESOURCES: LinkCard[] = [
  {
    key: 'pdf',
    label: 'PDF deck',
    helper: 'Vue synthétique des fonctionnalités et cas d’usage.',
    url: PDF_URL,
    icon: 'clipboard',
  },
  {
    key: 'video',
    label: 'Explainer video',
    helper: 'Démo vidéo pour partager rapidement la plateforme.',
    url: VIDEO_URL,
    icon: 'info',
  },
  {
    key: 'landing',
    label: 'Landing page',
    helper: 'Présentation publique et message marketing.',
    url: LANDING_URL,
    icon: 'globe',
  },
];

const MEETING_NOTES = [
  'Montrer les cas Yotix et Paytix avant d’entrer dans les écrans.',
  'Démontrer le parcours complet: recherche, réservation, billet QR.',
  'Garder le focus sur les besoins réels plutôt que sur toutes les fonctionnalités.',
];

export default function PlatformPage() {
  const openExternal = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Lien indisponible', 'Impossible d’ouvrir ce lien sur cet appareil.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable style={styles.backPill} onPress={() => router.back()}>
            <ArrowLeftIcon size={16} color={colors.orange} />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Espace démo</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Eventz brief</Text>
          <Text style={styles.heroTitle}>Le meilleur du demo kit, condensé dans YoTicks.</Text>
          <Text style={styles.heroText}>
            Cette page rassemble ce qui compte vraiment dans le brief reçu: clients de référence, accès de
            démonstration, ressources de vente et points de discussion pour le meeting.
          </Text>

          <View style={styles.statsRow}>
            <Stat label="Clients" value="2" />
            <Stat label="Accès démo" value="4" />
            <Stat label="Ressources" value="3" />
          </View>

          <Pressable style={styles.primaryCta} onPress={() => openExternal(DEMO_SITE)}>
            <Text style={styles.primaryCtaText}>Ouvrir la démo principale</Text>
            <ChevronRightIcon size={16} color={colors.black} />
          </Pressable>
        </View>

        <SectionTitle title="Clients actifs" subtitle="Les références à garder en tête pendant la démo." />
        <View style={styles.clientList}>
          {CLIENTS.map((client, index) => (
            <View key={client.name} style={styles.clientCard}>
              <View style={styles.clientHeader}>
                <View>
                  <Text style={styles.clientIndex}>0{index + 1}</Text>
                  <Text style={styles.clientName}>{client.name}</Text>
                </View>
                <View style={styles.clientTag}>
                  <Text style={styles.clientTagText}>{client.tag}</Text>
                </View>
              </View>
              <Text style={styles.clientFocus}>{client.focus}</Text>
              <Text style={styles.clientNote}>{client.note}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Accès démo" subtitle="Les entrées directes vers les parcours utiles." />
        <View style={styles.linkList}>
          {ACCESS_LINKS.map((link) => (
            <Pressable key={link.key} style={styles.linkCard} onPress={() => openExternal(link.url)}>
              <View style={styles.linkIconWrap}>{renderIcon(link.icon)}</View>
              <View style={styles.linkBody}>
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Text style={styles.linkHelper}>{link.helper}</Text>
              </View>
              <ChevronRightIcon size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <SectionTitle title="Ressources" subtitle="Matériel de vente et de partage pour accélérer la validation." />
        <View style={styles.resourceGrid}>
          {RESOURCES.map((resource) => (
            <Pressable key={resource.key} style={styles.resourceCard} onPress={() => openExternal(resource.url)}>
              <View style={styles.resourceTopRow}>
                <View style={styles.linkIconWrap}>{renderIcon(resource.icon)}</View>
                <ChevronRightIcon size={16} color={colors.textMuted} />
              </View>
              <Text style={styles.resourceLabel}>{resource.label}</Text>
              <Text style={styles.resourceHelper}>{resource.helper}</Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle title="Meeting prep" subtitle="Ce qu’il faut couvrir pendant l’échange." />
        <View style={styles.meetingCard}>
          <View style={styles.meetingHeader}>
            <Text style={styles.meetingDate}>Monday, February 23, 2026</Text>
            <Text style={styles.meetingStatus}>Note du brief</Text>
          </View>
          <View style={styles.noteList}>
            {MEETING_NOTES.map((note) => (
              <View key={note} style={styles.noteRow}>
                <View style={styles.noteBullet} />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function renderIcon(icon: LinkCard['icon']) {
  switch (icon) {
    case 'ticket':
      return <TicketIcon size={18} color={colors.orange} />;
    case 'clipboard':
      return <ClipboardIcon size={18} color={colors.orange} />;
    case 'info':
      return <InfoIcon size={18} color={colors.orange} />;
    case 'globe':
    default:
      return <GlobeIcon size={18} color={colors.orange} />;
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 14 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12 },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.text },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(242,100,59,0.12)',
    borderWidth: 1,
    borderColor: colors.borderOrange,
  },
  badgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  heroCard: {
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: 26,
    gap: 12,
  },
  heroEyebrow: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.text,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  heroText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  primaryCta: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCtaText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.black,
  },
  sectionTitleWrap: { marginBottom: 12, gap: 4 },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.text,
  },
  sectionSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  clientList: { gap: 12, marginBottom: 22 },
  clientCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  clientHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  clientIndex: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  clientName: {
    marginTop: 4,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  clientTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(242,100,59,0.12)',
    borderWidth: 1,
    borderColor: colors.borderOrange,
  },
  clientTagText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orange,
  },
  clientFocus: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  clientNote: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  linkList: { gap: 10, marginBottom: 22 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardHover,
  },
  linkBody: { flex: 1, gap: 3 },
  linkLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  linkHelper: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  resourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  resourceCard: {
    width: '48%',
    minHeight: 132,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  resourceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resourceLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  resourceHelper: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  meetingCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  meetingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  meetingDate: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  meetingStatus: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  noteList: { gap: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noteBullet: { width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: colors.orange },
  noteText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacer: { height: 40 },
});
