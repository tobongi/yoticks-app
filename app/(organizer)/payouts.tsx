import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getMerchantAccount, updateMerchantAccount, type BackendMerchantField, type BackendPaymentMethodKey } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { colors } from '../../src/theme/colors';
import { organizerColors } from '../../src/theme/organizer';
import { typography } from '../../src/theme/typography';
import { StatusSeal } from '../../src/ui/pictograms';
import { Screen } from '../../src/ui/screen';

type MerchantFormState = Record<BackendMerchantField['key'], string>;

const EMPTY_FORM: MerchantFormState = {
  businessName: '',
  supportEmail: '',
  country: '',
  city: '',
  phoneNumber: '',
  payoutDetails: '',
};
const DEFAULT_FIELDS: BackendMerchantField[] = [
  { key: 'businessName', label: 'Nom du commerce', placeholder: 'Dakar Nights SARL', value: '' },
  { key: 'supportEmail', label: 'Email support', placeholder: 'payments@dakarnights.sn', value: '' },
  { key: 'country', label: 'Pays', placeholder: 'Senegal', value: '' },
  { key: 'city', label: 'Ville', placeholder: 'Dakar', value: '' },
  { key: 'phoneNumber', label: 'Telephone', placeholder: '+221 77 000 00 00', value: '' },
  { key: 'payoutDetails', label: 'Versement', placeholder: 'Compte bancaire ou wallet marchand', value: '' },
];

function isPaymentMethod(value: string | undefined): value is BackendPaymentMethodKey {
  return value === 'apple_pay' || value === 'google_pay' || value === 'paypal' || value === 'card';
}

export default function OrganizerPayouts() {
  const { token, user } = useAuth();
  const { organizerId, paymentMethod, sessionId } = useLocalSearchParams<{
    organizerId?: string;
    paymentMethod?: string;
    sessionId?: string;
  }>();
  const [fields, setFields] = useState<BackendMerchantField[]>(DEFAULT_FIELDS);
  const [form, setForm] = useState<MerchantFormState>(EMPTY_FORM);
  const [providerName, setProviderName] = useState('Compte marchand');
  const [status, setStatus] = useState<'needs_info' | 'ready'>('needs_info');
  const [busy, setBusy] = useState(false);

  const canSave = Boolean(token && user?.role === 'organizer' && organizerId && user.id === organizerId);
  const normalizedPaymentMethod = isPaymentMethod(paymentMethod) ? paymentMethod : 'card';

  useEffect(() => {
    let active = true;

    if (!organizerId || !token) {
      return;
    }

    getMerchantAccount(organizerId, normalizedPaymentMethod, token).then((account) => {
      if (!active || !account) {
        return;
      }

      setFields(account.fields);
      setProviderName(account.providerName);
      setStatus(account.status);
      setForm(
        account.fields.reduce<MerchantFormState>(
          (next, field) => ({ ...next, [field.key]: field.value }),
          EMPTY_FORM,
        ),
      );
    });

    return () => {
      active = false;
    };
  }, [normalizedPaymentMethod, organizerId, token]);

  const heading = useMemo(() => {
    if (sessionId) {
      return 'Completer le compte marchand pour debloquer le checkout';
    }

    return 'Configurer le compte marchand';
  }, [sessionId]);

  const handleSave = async () => {
    if (!organizerId || !token) {
      return;
    }

    setBusy(true);
    try {
      const account = await updateMerchantAccount(organizerId, normalizedPaymentMethod, form, token);
      if (!account) {
        throw new Error('Configuration impossible');
      }

      setFields(account.fields);
      setProviderName(account.providerName);
      setStatus(account.status);
      Alert.alert('Compte marchand', account.status === 'ready' ? 'Configuration enregistree.' : 'Informations sauvegardees.');
    } catch (error) {
      Alert.alert('Compte marchand', error instanceof Error ? error.message : 'Configuration impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen bleed>
      <Text style={styles.kicker}>{providerName}</Text>
      <Text style={styles.title}>{heading}</Text>
      <Text style={styles.copy}>Complète les cases pour recevoir l’argent.</Text>

      <View style={styles.statusCard}>
        <StatusSeal pictogram={status === 'ready' ? 'check' : 'blocked'} tone={status === 'ready' ? 'green' : 'red'} label={status === 'ready' ? 'PRÊT' : 'À COMPLÉTER'} size={76} />
        <Text style={styles.statusLabel}>Statut</Text>
        <Text style={styles.statusValue}>{status === 'ready' ? 'Pret pour l encaissement' : 'Informations manquantes'}</Text>
        {sessionId ? <Text style={styles.statusHint}>Session source: {sessionId}</Text> : null}
      </View>

      <View style={styles.formCard}>
        {fields.map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              value={form[field.key]}
              onChangeText={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
              placeholder={field.placeholder}
              placeholderTextColor={organizerColors.textSecondary}
              style={styles.input}
            />
          </View>
        ))}
      </View>

      {!canSave ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Connexion organisateur requise</Text>
          <Text style={styles.noticeCopy}>
            La page est prete pour les infos marchand, mais seule la session de l organisateur correspondant peut les enregistrer.
          </Text>
        </View>
      ) : null}

      <Pressable accessibilityRole="button" accessibilityLabel="Enregistrer les informations de paiement" accessibilityState={{ disabled: !canSave || busy, busy }}
        style={[styles.primaryButton, (!canSave || busy) && styles.primaryButtonDisabled]}
        disabled={!canSave || busy}
        onPress={handleSave}
      >
        <Text style={styles.primaryButtonText}>{busy ? 'Enregistrement...' : 'Enregistrer le compte marchand'}</Text>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Retour</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
  },
  title: { fontFamily: typography.fontFamily.bold, fontSize: 28, lineHeight: 34, color: organizerColors.text },
  copy: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, lineHeight: 22, color: organizerColors.textSecondary },
  statusCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.border,
    gap: 6,
  },
  statusLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  statusValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: organizerColors.text },
  statusHint: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: organizerColors.textSecondary },
  formCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.border,
    gap: 14,
  },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: organizerColors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.1 },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
    backgroundColor: organizerColors.background,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: organizerColors.text,
  },
  noticeCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: organizerColors.accentSoft,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
    gap: 6,
  },
  noticeTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orangeInk },
  noticeCopy: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, lineHeight: 20, color: organizerColors.textSecondary },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: colors.orange,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.black },
  backButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: organizerColors.accentSoft,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
  },
  backText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orangeInk },
});
