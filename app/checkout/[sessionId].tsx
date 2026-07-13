import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon, ChevronRightIcon, TicketIcon } from '../../src/icons';
import { getCheckoutSession, type BackendCheckoutSession } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

function statusCopy(session: BackendCheckoutSession) {
  if (session.status === 'requires_merchant_setup') {
    return {
      eyebrow: 'Provider handoff',
      title: `${session.providerName} attend le compte marchand`,
      detail:
        'La reservation est bien routee vers le provider, mais le compte organisateur n est pas encore configure pour encaisser ce paiement.',
      cta: 'Configurer le compte marchand',
    };
  }

  return {
    eyebrow: 'Provider handoff',
    title: `${session.providerName} pret a prendre le relais`,
    detail: 'La session de paiement est creee. La collecte finale du paiement peut maintenant se brancher sur ce point.',
    cta: 'Voir le compte marchand',
  };
}

export default function CheckoutSessionPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { token } = useAuth();
  const [session, setSession] = useState<BackendCheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!sessionId || !token) {
      setLoading(false);
      return;
    }

    getCheckoutSession(sessionId, token)
      .then((nextSession) => {
        if (active) {
          setSession(nextSession);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [sessionId, token]);

  const copy = useMemo(() => (session ? statusCopy(session) : null), [session]);
  const handleBack = () => {
    if (session?.event?.id) {
      router.replace({ pathname: '/reserver/[id]', params: { id: session.event.id } });
      return;
    }

    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.orange} />
          <Text style={styles.centerText}>Connexion au provider...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session || !copy) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Session introuvable</Text>
          <Text style={styles.centerText}>La passerelle de paiement n a pas pu recharger cette session.</Text>
          <Pressable style={styles.primaryButton} onPress={handleBack}>
            <Text style={styles.primaryButtonText}>Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable style={styles.backPill} onPress={handleBack}>
            <ArrowLeftIcon size={16} color={colors.orange} />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <View style={styles.providerPill}>
            <Text style={styles.providerPillText}>{session.providerName}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.detail}>{copy.detail}</Text>

          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Montant</Text>
              <Text style={styles.amountValue}>{session.amountLabel}</Text>
            </View>
            <View style={styles.stateBadge}>
              <Text style={styles.stateBadgeText}>
                {session.status === 'requires_merchant_setup' ? 'Action requise' : 'Session prete'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <TicketIcon size={18} color={colors.orange} />
            <Text style={styles.summaryTitle}>Recapitulatif provider</Text>
          </View>
          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Evenement</Text>
              <Text style={styles.summaryValue}>{session.event.title}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Billet</Text>
              <Text style={styles.summaryValue}>{session.tier}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Compte marchand</Text>
              <Text style={styles.summaryValue}>{session.merchantAccount.status === 'ready' ? 'Configure' : 'A completer'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>Informations marchand requises</Text>
          <Text style={styles.setupCopy}>
            C est ici que le provider bloque tant que les informations de commerce ne sont pas completees.
          </Text>

          <View style={styles.fieldList}>
            {session.merchantAccount.fields.map((field) => (
              <View key={field.key} style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue}>{field.value || field.placeholder}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: '/(organizer)/payouts',
                params: {
                  organizerId: session.organizerId,
                  paymentMethod: session.paymentMethod,
                  sessionId: session.id,
                },
              })
            }
          >
            <Text style={styles.primaryButtonText}>{copy.cta}</Text>
            <ChevronRightIcon size={16} color={colors.black} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 16 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  centerText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textSecondary, textAlign: 'center' },
  errorTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  backPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  backText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.text },
  providerPill: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.accentWash, borderWidth: 1, borderColor: colors.borderOrange },
  providerPillText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.orange, textTransform: 'uppercase', letterSpacing: 1.5 },
  heroCard: { padding: 20, borderRadius: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 },
  eyebrow: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.orange, textTransform: 'uppercase', letterSpacing: 2.1 },
  title: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], color: colors.text, lineHeight: 34 },
  detail: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textSecondary, lineHeight: 24 },
  amountRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  amountLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  amountValue: { marginTop: 4, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.text },
  stateBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceSoft },
  stateBadgeText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.orange, textTransform: 'uppercase', letterSpacing: 1.2 },
  summaryCard: { padding: 18, borderRadius: 24, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.border, gap: 12 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base, color: colors.text },
  summaryList: { gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  summaryLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.1 },
  summaryValue: { flex: 1, textAlign: 'right', fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  setupCard: { padding: 18, borderRadius: 24, backgroundColor: '#121B16', borderWidth: 1, borderColor: '#1D3027', gap: 12 },
  setupTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.card },
  setupCopy: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, lineHeight: 22, color: '#D4E5D9' },
  fieldList: { gap: 10 },
  fieldCard: { padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 4 },
  fieldLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: '#93B5A0', textTransform: 'uppercase', letterSpacing: 1.1 },
  fieldValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.card },
  primaryButton: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 15, borderRadius: 18, backgroundColor: colors.orange },
  primaryButtonText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.black },
});
