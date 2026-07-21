import { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { updateProfile } from '../src/backend';
import { useAuth } from '../src/auth';
import { useI18n } from '../src/i18n';
import { ensureNotificationPermissions, getNotificationPermissionStatus } from '../src/notifications';
import { ArrowLeftIcon, ChevronRightIcon } from '../src/icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { Chip, ScreenHeader, SectionBlock } from '../src/ui/lived-in';
import { Pictogram, StatusSeal } from '../src/ui/pictograms';
import { Screen } from '../src/ui/screen';

export default function SettingsScreen() {
  const auth = useAuth();
  const { locale, setLocale } = useI18n();
  const [name, setName] = useState(auth.user?.name ?? '');
  const [email, setEmail] = useState(auth.user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { void getNotificationPermissionStatus().then(setNotificationStatus); }, []);

  const saveProfile = async () => {
    if (!name.trim() || !email.trim()) return setNotice('Nom et email requis.');
    if (!auth.token) return setNotice('Connecte-toi pour modifier ce compte.');
    setSaving(true);
    setNotice('');
    try {
      await updateProfile({ name, email }, auth.token);
      await auth.refreshUser();
      setNotice('Compte mis à jour.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Mise à jour impossible.');
    } finally {
      setSaving(false);
    }
  };

  const enableNotifications = async () => {
    const granted = await ensureNotificationPermissions();
    setNotificationStatus(granted ? 'granted' : await getNotificationPermissionStatus());
    if (!granted) Alert.alert('Notifications bloquées', 'Tu peux les autoriser dans les réglages du téléphone.', [
      { text: 'Plus tard', style: 'cancel' },
      { text: 'Ouvrir les réglages', onPress: () => void Linking.openSettings() },
    ]);
  };

  const confirmDelete = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      await auth.deleteAccount(deletePassword);
      setDeleteVisible(false);
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Suppression impossible', error instanceof Error ? error.message : 'Réessaie.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen bleed>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.back} onPress={() => router.back()}>
        <ArrowLeftIcon size={16} color={colors.orangeInk} /><Text style={styles.backText}>Retour</Text>
      </Pressable>
      <ScreenHeader eyebrow="Compte" title="Réglages" side={<Pictogram pictogram="profile" tone="blue" size={62} />} />

      <SectionBlock eyebrow="Identité" title="Mon compte">
        <View style={styles.formCard}>
          <Text style={styles.label}>Nom</Text>
          <TextInput accessibilityLabel="Nom" style={styles.input} value={name} onChangeText={setName} autoComplete="name" />
          <Text style={styles.label}>Email</Text>
          <TextInput accessibilityLabel="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
          <Pressable accessibilityRole="button" style={styles.primaryButton} disabled={saving} onPress={() => void saveProfile()}>
            <Text style={styles.primaryButtonText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
          </Pressable>
        </View>
      </SectionBlock>

      <SectionBlock eyebrow="Préférences" title="Sur ce téléphone">
        <View style={styles.settingCard}>
          <View style={styles.settingIcon}><Pictogram pictogram="talk" tone="blue" size={46} /></View>
          <View style={styles.settingBody}><Text style={styles.settingTitle}>Langue</Text><Text style={styles.settingCopy}>Français ou English</Text></View>
          <View style={styles.chips}><Chip label="FR" active={locale === 'fr'} onPress={() => setLocale('fr')} /><Chip label="EN" active={locale === 'en'} onPress={() => setLocale('en')} /></View>
        </View>
        <Pressable accessibilityRole="button" style={styles.settingCard} onPress={() => void enableNotifications()}>
          <View style={styles.settingIcon}><Pictogram pictogram="bell" size={46} /></View>
          <View style={styles.settingBody}><Text style={styles.settingTitle}>Alertes</Text><Text style={styles.settingCopy}>{notificationStatus === 'granted' ? 'Activées' : notificationStatus === 'denied' ? 'Bloquées' : 'Désactivées'}</Text></View>
          <ChevronRightIcon size={16} color={colors.textMuted} />
        </Pressable>
      </SectionBlock>

      <SectionBlock eyebrow="Confiance" title="Aide et données">
        <Pressable accessibilityRole="button" style={styles.settingCard} onPress={() => router.push('/legal' as never)}>
          <View style={styles.settingIcon}><Pictogram pictogram="help" tone="blue" size={46} /></View>
          <View style={styles.settingBody}><Text style={styles.settingTitle}>Aide et confidentialité</Text><Text style={styles.settingCopy}>Support et règles</Text></View>
          <ChevronRightIcon size={16} color={colors.textMuted} />
        </Pressable>
        <Text style={styles.version}>YoTicks {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </SectionBlock>

      <View style={styles.dangerCard}>
        <StatusSeal pictogram="blocked" tone="red" label="Supprimer" size={64} />
        <Text style={styles.dangerTitle}>Supprimer mon compte</Text>
        <Text style={styles.dangerCopy}>Efface définitivement le profil et les billets.</Text>
        <Pressable accessibilityRole="button" style={styles.deleteButton} onPress={() => setDeleteVisible(true)}><Text style={styles.deleteText}>Supprimer définitivement</Text></Pressable>
      </View>

    <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => setDeleteVisible(false)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Confirmer la suppression</Text>
          <Text style={styles.dangerCopy}>Entre ton mot de passe. Cette action est définitive.</Text>
          <TextInput accessibilityLabel="Mot de passe actuel" style={styles.input} value={deletePassword} onChangeText={setDeletePassword} placeholder="Mot de passe actuel" placeholderTextColor={colors.textMuted} secureTextEntry />
          <View style={styles.modalActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Annuler la suppression" style={styles.cancelButton} onPress={() => setDeleteVisible(false)}><Text style={styles.cancelText}>Annuler</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Supprimer définitivement mon compte" accessibilityState={{ disabled: deleting || !deletePassword, busy: deleting }} style={styles.confirmDeleteButton} disabled={deleting || !deletePassword} onPress={() => void confirmDelete()}><Text style={styles.confirmDeleteText}>{deleting ? 'Suppression...' : 'Supprimer'}</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.orangeInk },
  formCard: { borderRadius: 24, padding: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, gap: 8 },
  label: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.xs, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2 },
  input: { minHeight: 52, borderRadius: 16, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 14, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.text },
  notice: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  primaryButton: { minHeight: 52, borderRadius: 18, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.black },
  settingCard: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong },
  settingIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentWash },
  settingBody: { flex: 1, gap: 3 },
  settingTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  settingCopy: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, lineHeight: 17, color: colors.textSecondary },
  chips: { flexDirection: 'row', gap: 6 },
  version: { textAlign: 'center', fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textMuted },
  dangerCard: { borderRadius: 24, padding: 18, gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.red + '55' },
  dangerTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.red },
  dangerCopy: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary },
  deleteButton: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.red },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(17,17,17,0.62)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 28, padding: 18, gap: 14, backgroundColor: colors.card },
  modalTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardStrong },
  cancelText: { fontFamily: typography.fontFamily.semiBold, color: colors.text },
  confirmDeleteButton: { flex: 1, minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.red },
  confirmDeleteText: { fontFamily: typography.fontFamily.semiBold, color: colors.ivory },
});
