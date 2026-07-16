import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from '../src/icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { LivedBackground, ScreenHeader } from '../src/ui/lived-in';
import { Pictogram } from '../src/ui/pictograms';
import type { PictogramKey } from '../src/ui/visual-language';

const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@yoticks.app';

export default function LegalScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.back} onPress={() => router.back()}>
          <ArrowLeftIcon size={16} color={colors.orange} /><Text style={styles.backText}>Retour</Text>
        </Pressable>
        <ScreenHeader eyebrow="Confiance" title="Aide et règles" side={<Pictogram pictogram="help" tone="blue" size={62} />} />

        <LegalSection title="Besoin d’aide ?" pictogram="help">
          <Text style={styles.body}>Écris-nous pour un billet, un paiement, un accès organisateur ou une demande concernant tes données.</Text>
          <Pressable accessibilityRole="link" style={styles.contactButton} onPress={() => void Linking.openURL(`mailto:${supportEmail}?subject=Support%20YoTicks`)}>
            <Text style={styles.contactText}>{supportEmail}</Text>
          </Pressable>
        </LegalSection>

        <LegalSection title="Confidentialité" pictogram="profile">
          <Text style={styles.body}>YoTicks utilise les informations nécessaires pour créer ton compte, sécuriser la connexion, personnaliser la découverte, conserver tes favoris, émettre tes billets, afficher les notifications et aider les organisateurs à contrôler l’entrée.</Text>
          <Bullet>Compte : nom, email, mot de passe chiffré et rôle.</Bullet>
          <Bullet>Billetterie : réservations, billets, statut d’entrée et montant associé.</Bullet>
          <Bullet>Préférences : ville, catégories, recherches, favoris et organisateurs suivis.</Bullet>
          <Bullet>Appareil : autorisation caméra uniquement pour scanner, notifications uniquement après ton choix.</Bullet>
          <Text style={styles.body}>Nous ne vendons pas tes données. L’accès est limité au fonctionnement de la billetterie et à la sécurité. Tu peux supprimer ton compte depuis Réglages ; les données personnelles liées sont supprimées et les événements organisateur sont dissociés du compte.</Text>
        </LegalSection>

        <LegalSection title="Règles du billet" pictogram="ticket">
          <Bullet>Un billet est personnel sauf indication contraire de l’organisateur.</Bullet>
          <Bullet>Un QR déjà utilisé, annulé ou inconnu peut être refusé à l’entrée.</Bullet>
          <Bullet>Les prix, horaires, politiques de remboursement et conditions d’accès sont définis par l’organisateur avant confirmation.</Bullet>
          <Bullet>YoTicks n’affiche jamais un paiement comme réussi avant confirmation du prestataire.</Bullet>
          <Bullet>Les organisateurs restent responsables de la tenue, de l’annulation et de la sécurité de leurs événements.</Bullet>
        </LegalSection>

        <LegalSection title="Tes choix" pictogram="check">
          <Text style={styles.body}>Tu peux refuser la caméra et entrer un code manuellement, refuser les notifications, changer la langue, corriger ton profil, te déconnecter ou supprimer définitivement ton compte. Pour un accès ou une rectification plus large, contacte le support.</Text>
        </LegalSection>

        <Text style={styles.updated}>Version du 13 juillet 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegalSection({ title, pictogram, children }: { title: string; pictogram: PictogramKey; children: React.ReactNode }) {
  return <View style={styles.section}><View style={styles.sectionHead}><Pictogram pictogram={pictogram} tone={pictogram === 'check' ? 'green' : 'blue'} size={52} /><Text style={styles.sectionTitle}>{title}</Text></View>{children}</View>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return <View style={styles.bulletRow}><View style={styles.bullet} /><Text style={styles.bulletText}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: 20, paddingBottom: 48, gap: 18 },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.orange },
  section: { borderRadius: 24, padding: 18, gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text },
  body: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 8, height: 8, borderRadius: 4, marginTop: 7, backgroundColor: colors.orange },
  bulletText: { flex: 1, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, lineHeight: 21, color: colors.text },
  contactButton: { minHeight: 48, borderRadius: 16, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  contactText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.black },
  updated: { textAlign: 'center', fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted },
});
