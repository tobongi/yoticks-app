import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon, ChevronRightIcon, TicketIcon } from '../../src/icons';
import { finalizeMobileMoneyPayment, getCheckoutSession, getLatestMobileMoneyTransactionForCheckout, getMobileMoneyOptions, initiateMobileMoneyPayment, refreshMobileMoneyTransaction, type BackendCheckoutSession, type BackendMobileMoneyTransaction } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { CHECKOUT_POLL_INTERVAL_MS, getCheckoutActions, getNetworksForSelection, getPendingTiming, sanitizeProviderInstructions, type MobileMoneyCountryOption } from '../../src/mobile-money-checkout';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { LivedBackground } from '../../src/ui/lived-in';
import { Pictogram, StatusSeal } from '../../src/ui/pictograms';

function statusCopy(session: BackendCheckoutSession) {
  if (session.status === 'requires_merchant_setup') {
    return {
      eyebrow: 'Provider handoff',
      title: `${session.providerName} attend le compte marchand`,
      detail: 'Le compte marchand doit être complété.',
      cta: 'Configurer le compte marchand',
    };
  }

  return {
    eyebrow: 'Provider handoff',
    title: `${session.providerName} pret a prendre le relais`,
    detail: 'Le paiement peut continuer.',
    cta: 'Voir le compte marchand',
  };
}

export default function CheckoutSessionPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { token } = useAuth();
  const [session, setSession] = useState<BackendCheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<BackendMobileMoneyTransaction | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<MobileMoneyCountryOption[]>([]);
  const [countryCode, setCountryCode] = useState('');
  const [currency, setCurrency] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('');
  const [omOtp, setOmOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [startingPayment, setStartingPayment] = useState(false);
  const [refreshingPayment, setRefreshingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;

    if (!sessionId || !token) {
      setLoading(false);
      return;
    }

    Promise.all([getCheckoutSession(sessionId, token), getMobileMoneyOptions(token), getLatestMobileMoneyTransactionForCheckout(sessionId, token)])
      .then(([nextSession, countries, restoredTransaction]) => {
        if (active) {
          setSession(nextSession);
          setPaymentOptions(countries);
          setTransaction(restoredTransaction);
          if (restoredTransaction) {
            setCountryCode(restoredTransaction.countryCode);
            setCurrency(restoredTransaction.currency);
            setNetwork(restoredTransaction.network);
          }
        }
      })
      .catch((error) => {
        if (active) setPaymentError(error instanceof Error ? error.message : 'Configuration de paiement indisponible.');
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

  useEffect(() => {
    if (!transaction || !token || transaction.status !== 'pending') return;
    const timer = setTimeout(async () => {
      try {
        const next = await refreshMobileMoneyTransaction(transaction.id, token);
        if (next) setTransaction(next);
      } catch (error) {
        setPaymentError(error instanceof Error ? error.message : 'Vérification automatique impossible.');
      }
    }, CHECKOUT_POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [transaction, token]);

  useEffect(() => {
    if (transaction?.status !== 'pending') return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [transaction?.id, transaction?.status]);

  const copy = useMemo(() => (session ? statusCopy(session) : null), [session]);
  const selectedCountry = paymentOptions.find((country) => country.code === countryCode);
  const currencyOptions = selectedCountry?.currencies ?? [];
  const networkOptions = getNetworksForSelection(paymentOptions, countryCode, currency);
  const transactionActions = transaction ? getCheckoutActions(transaction.status) : null;
  const pendingTiming = transaction?.status === 'pending'
    ? getPendingTiming(Date.parse(transaction.createdAt), now)
    : null;
  const handleBack = () => {
    if (session?.event?.id) {
      router.replace({ pathname: '/reserver/[id]', params: { id: session.event.id } });
      return;
    }

    router.replace('/(tabs)');
  };

  const finalizeMobileMoney = async () => {
    if (!transaction || !token || !otp.trim()) return;
    setStartingPayment(true);
    setPaymentError(null);
    try {
      await finalizeMobileMoneyPayment(transaction.id, otp.trim(), token);
      const refreshed = await refreshMobileMoneyTransaction(transaction.id, token);
      if (refreshed) setTransaction(refreshed);
      setOtp('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Code invalide';
      setPaymentError(message);
      Alert.alert('Code mobile money', message);
    } finally {
      setStartingPayment(false);
    }
  };

  const refreshMobileMoney = async () => {
    if (!transaction || !token || transaction.status !== 'pending') return;
    setRefreshingPayment(true);
    setPaymentError(null);
    try {
      const refreshed = await refreshMobileMoneyTransaction(transaction.id, token);
      if (refreshed) setTransaction(refreshed);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Vérification impossible. Réessaie.');
    } finally {
      setRefreshingPayment(false);
    }
  };

  const retryMobileMoney = () => {
    setTransaction(null);
    setOtp('');
    setOmOtp('');
    setPaymentError(null);
  };

  const startMobileMoneyPayment = async () => {
    if (!session || !token || !countryCode || !currency || !network || !phoneNumber.trim()) {
      Alert.alert('Informations requises', 'Choisis le pays, la devise et le réseau, puis ajoute le numéro mobile money.');
      return;
    }
    setStartingPayment(true);
    setPaymentError(null);
    try {
      const next = await initiateMobileMoneyPayment({
        checkoutSessionId: session.id,
        network,
        phoneNumber: phoneNumber.trim(),
        countryCode,
        currency,
        ...(network === 'orange' && omOtp.trim() ? { omOtp: omOtp.trim() } : {}),
      }, token);
      if (!next) throw new Error('Impossible de démarrer le paiement mobile money.');
      setTransaction(next);
      setNow(Date.now());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Paiement impossible';
      setPaymentError(message);
      Alert.alert('Paiement mobile money', message);
    } finally {
      setStartingPayment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LivedBackground />
        <View style={styles.centerState}>
          <Pictogram pictogram="history" tone="blue" size={88} />
          <ActivityIndicator color={colors.orange} />
          <Text style={styles.centerText}>Connexion au provider...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session || !copy) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LivedBackground />
        <View style={styles.centerState}>
          <Pictogram pictogram="blocked" tone="red" size={88} />
          <Text style={styles.errorTitle}>Session introuvable</Text>
          <Text style={styles.centerText}>La passerelle de paiement n a pas pu recharger cette session.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.primaryButton} onPress={handleBack}>
            <Text style={styles.primaryButtonText}>Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LivedBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.backPill} onPress={handleBack}>
            <ArrowLeftIcon size={16} color={colors.orange} />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <View style={styles.providerPill}>
            <Text style={styles.providerPillText}>{session.providerName}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <StatusSeal pictogram={session.status === 'requires_merchant_setup' ? 'blocked' : 'check'} tone={session.status === 'requires_merchant_setup' ? 'red' : 'green'} label={session.status === 'requires_merchant_setup' ? 'À compléter' : 'Prêt'} size={78} />
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

        {session.paymentMethod === 'mbiyopay_mobile_money' ? (
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>Payer par mobile money</Text>
            <Text style={styles.setupCopy}>Entre le numéro du client. Il recevra ensuite la demande de confirmation sur son téléphone.</Text>
            {!transaction ? (
              <>
                <Text style={styles.fieldPrompt}>1. Pays du compte mobile money</Text>
                <View style={styles.networkList} accessibilityRole="radiogroup">
                  {paymentOptions.map((country) => (
                    <Pressable
                      key={country.code}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: countryCode === country.code }}
                      style={[styles.networkChip, countryCode === country.code && styles.networkChipActive]}
                      onPress={() => {
                        setCountryCode(country.code);
                        setCurrency('');
                        setNetwork('');
                      }}
                    >
                      <Text style={[styles.networkChipText, countryCode === country.code && styles.networkChipTextActive]}>{country.name}</Text>
                    </Pressable>
                  ))}
                </View>
                {countryCode ? (
                  <>
                    <Text style={styles.fieldPrompt}>2. Devise à débiter</Text>
                    <View style={styles.networkList} accessibilityRole="radiogroup">
                      {currencyOptions.map((option) => (
                        <Pressable
                          key={option.code}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: currency === option.code }}
                          style={[styles.networkChip, currency === option.code && styles.networkChipActive]}
                          onPress={() => {
                            setCurrency(option.code);
                            setNetwork('');
                          }}
                        >
                          <Text style={[styles.networkChipText, currency === option.code && styles.networkChipTextActive]}>{option.code}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}
                {currency ? (
                  <>
                    <Text style={styles.fieldPrompt}>3. Réseau mobile money</Text>
                    <View style={styles.networkList} accessibilityRole="radiogroup">
                      {networkOptions.map((option) => (
                        <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: network === option }} style={[styles.networkChip, network === option && styles.networkChipActive]} onPress={() => setNetwork(option)}>
                          <Text style={[styles.networkChipText, network === option && styles.networkChipTextActive]}>{option}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}
                <Text style={styles.fieldPrompt}>4. Numéro du compte</Text>
                <TextInput accessibilityLabel="Numéro mobile money" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="+243 812 345 678" placeholderTextColor="#93B5A0" keyboardType="phone-pad" style={styles.paymentInput} />
                {network === 'orange' ? <TextInput accessibilityLabel="Code OTP Orange optionnel" value={omOtp} onChangeText={setOmOtp} placeholder="OTP Orange (optionnel)" placeholderTextColor="#93B5A0" keyboardType="number-pad" style={styles.paymentInput} /> : null}
                {currency ? <Text style={styles.chargeReview}>Montant débité : {session.amount.toLocaleString('fr-FR')} {currency}</Text> : null}
                {paymentError ? <Text accessibilityRole="alert" style={styles.errorMessage}>{paymentError}</Text> : null}
                <Pressable accessibilityRole="button" accessibilityLabel="Démarrer le paiement mobile money" style={[styles.primaryButton, startingPayment && styles.buttonDisabled]} onPress={startMobileMoneyPayment} disabled={startingPayment}>
                  <Text style={styles.primaryButtonText}>{startingPayment ? 'Connexion...' : 'Démarrer le paiement'}</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.transactionBox}>
                <Text style={styles.transactionStatus}>{transaction.status === 'successful' ? 'Paiement confirmé' : transaction.status === 'failed' ? 'Paiement échoué' : transaction.status === 'cancelled' ? 'Paiement annulé' : 'Confirmation en attente'}</Text>
                <Text style={styles.setupCopy}>Référence : {transaction.providerTransactionId ?? transaction.id}</Text>
                <Text style={styles.setupCopy}>{transaction.countryCode} • {transaction.currency} • {transaction.network}</Text>
                {transaction.instructions ? <Text style={styles.instructions}>{sanitizeProviderInstructions(transaction.instructions)}</Text> : null}
                {pendingTiming ? (
                  <View style={[styles.pendingPanel, pendingTiming.timedOut && styles.timeoutPanel]}>
                    <Text style={styles.pendingTitle}>{pendingTiming.timedOut ? 'Cela prend plus de temps que prévu' : `Vérification automatique • ${pendingTiming.remainingSeconds} s`}</Text>
                    <Text style={styles.setupCopy}>{pendingTiming.timedOut ? 'Le paiement peut encore être confirmé. Vérifie son état sans payer une deuxième fois.' : 'Tu peux aussi vérifier maintenant après avoir confirmé sur le téléphone.'}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Vérifier le paiement maintenant" style={styles.secondaryButton} onPress={refreshMobileMoney} disabled={refreshingPayment}>
                      <Text style={styles.secondaryButtonText}>{refreshingPayment ? 'Vérification...' : 'Vérifier maintenant'}</Text>
                    </Pressable>
                  </View>
                ) : null}
                {paymentError ? <Text accessibilityRole="alert" style={styles.errorMessage}>{paymentError}</Text> : null}
                {transaction.authMode === 'pin' && transaction.status === 'pending' ? (
                  <>
                    <TextInput accessibilityLabel="Code PIN mobile money" value={otp} onChangeText={setOtp} placeholder="Code PIN / OTP" placeholderTextColor="#93B5A0" keyboardType="number-pad" secureTextEntry style={styles.paymentInput} />
                    <Pressable accessibilityRole="button" accessibilityLabel="Confirmer le code mobile money" style={styles.primaryButton} onPress={finalizeMobileMoney} disabled={startingPayment}>
                      <Text style={styles.primaryButtonText}>{startingPayment ? 'Confirmation...' : 'Confirmer le code'}</Text>
                    </Pressable>
                  </>
                ) : null}
                {transaction.redirectUrl ? <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir la page de paiement" style={styles.primaryButton} onPress={() => Linking.openURL(transaction.redirectUrl!)}><Text style={styles.primaryButtonText}>Ouvrir le paiement</Text></Pressable> : null}
                {transactionActions?.canRetry ? <Pressable accessibilityRole="button" accessibilityLabel="Réessayer le paiement" style={styles.primaryButton} onPress={retryMobileMoney}><Text style={styles.primaryButtonText}>Réessayer</Text></Pressable> : null}
                {transactionActions?.canViewTickets ? <Pressable accessibilityRole="button" accessibilityLabel="Voir mon billet" style={styles.primaryButton} onPress={() => router.replace('/(tabs)/tickets')}><Text style={styles.primaryButtonText}>Voir mon billet</Text></Pressable> : null}
              </View>
            )}
          </View>
        ) : <View style={styles.setupCard}>
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

          <Pressable accessibilityRole="button" accessibilityLabel={copy.cta}
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
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
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
  paymentInput: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', color: colors.card, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base },
  fieldPrompt: { marginTop: 4, color: colors.card, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm },
  chargeReview: { padding: 12, borderRadius: 14, overflow: 'hidden', color: colors.card, backgroundColor: 'rgba(255,255,255,0.08)', fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.base },
  networkList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  networkChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  networkChipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  networkChipText: { color: '#D4E5D9', fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, textTransform: 'capitalize' },
  networkChipTextActive: { color: colors.black },
  transactionBox: { gap: 10 },
  transactionStatus: { color: colors.card, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg },
  instructions: { color: '#D4E5D9', fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, lineHeight: 22 },
  pendingPanel: { padding: 14, borderRadius: 18, gap: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  timeoutPanel: { borderColor: colors.orange, backgroundColor: 'rgba(249,159,34,0.10)' },
  pendingTitle: { color: colors.card, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm },
  secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.orange },
  secondaryButtonText: { color: colors.orange, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm },
  errorMessage: { padding: 12, borderRadius: 14, overflow: 'hidden', color: '#FFD7D7', backgroundColor: 'rgba(215,31,39,0.20)', fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, lineHeight: 20 },
  buttonDisabled: { opacity: 0.6 },
});
