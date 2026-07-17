import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestPasswordReset } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { getPostAuthRoute } from '../../src/routing';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { ActionTile, HeroPanel, LivedBackground } from '../../src/ui/lived-in';
import { usePhoneLayout } from '../../src/ui/responsive';
import { Pictogram, TicketStubArt } from '../../src/ui/pictograms';

export default function Login() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const auth = useAuth();
  const layout = usePhoneLayout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [devRole, setDevRole] = useState<'attendee' | 'organizer'>('attendee');

  const goNext = (role: 'attendee' | 'organizer') => {
    router.replace(getPostAuthRoute({ redirect, role }) as never);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email + mot de passe');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const user = await auth.login(email, password);
      goNext(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setBusy(false);
    }
  };

  const handleDevLogin = async (role: 'attendee' | 'organizer') => {
    if (busy) {
      return;
    }

    setBusy(true);
    setError('');
    setDevRole(role);
    try {
      await auth.devLogin(role);
      goNext(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Mot de passe oublié', 'Entre ton adresse email.');
      return;
    }
    setResetBusy(true);
    try {
      setEmail(resetEmail);
      await requestPasswordReset(resetEmail);
      setResetVisible(false);
      Alert.alert('Vérifie tes messages', 'Si ce compte existe, un lien valable 30 minutes a été envoyé.');
    } catch (err) {
      Alert.alert('Mot de passe oublié', err instanceof Error ? err.message : 'Envoi impossible');
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LivedBackground />
        <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: layout.screenPadding, paddingTop: layout.authTopPadding }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.brand}>YOTICKS</Text>
          <HeroPanel eyebrow="Entrer" title="Retrouve tes billets" subtitle="Email + mot de passe" art={<TicketStubArt size={96} />}>
            <View style={styles.form}>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mot de passe" placeholderTextColor={colors.textMuted} secureTextEntry />
              {!!error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable accessibilityRole="button" accessibilityLabel="Entrer" accessibilityState={{ disabled: busy, busy }} style={styles.primaryButton} onPress={handleLogin} disabled={busy}>
                <Text style={styles.primaryButtonText}>{busy ? 'Connexion...' : 'Entrer'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Créer un compte" style={styles.secondaryButton} onPress={() => router.push('/auth/register')}>
                <Text style={styles.secondaryButtonText}>Creer un compte</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir la reinitialisation du mot de passe" style={styles.linkButton} onPress={() => { setResetEmail(email); setResetVisible(true); }}>
                <Text style={styles.linkText}>Mot de passe oublie</Text>
              </Pressable>
            </View>
          </HeroPanel>

          <View style={styles.devBlock}>
            <ActionTile icon={<Pictogram pictogram="profile" tone="blue" size={46} />} label="Visiteur" hint="Démo" tone="blue" onPress={() => void handleDevLogin('attendee')} style={[styles.devTile, { width: layout.tileWidth }, devRole === 'attendee' ? styles.devActive : undefined]} />
            <ActionTile icon={<Pictogram pictogram="scan" tone="green" size={46} />} label="Organisateur" hint="Démo" tone="green" onPress={() => void handleDevLogin('organizer')} style={[styles.devTile, { width: layout.tileWidth }, devRole === 'organizer' ? styles.devActive : undefined]} />
          </View>
        </ScrollView>

        <Modal visible={resetVisible} transparent animationType="fade" onRequestClose={() => setResetVisible(false)}>
          <View style={styles.modalBackdrop}>
            <Pressable accessibilityRole="button" accessibilityLabel="Fermer la fenetre de reinitialisation" style={styles.modalScrim} onPress={() => setResetVisible(false)} />
            <View style={[styles.modalCard, { maxWidth: layout.modalCardWidth }]}>
              <Text style={styles.modalTitle}>Retrouver mon compte</Text>
              <Text style={styles.modalCopy}>Nous envoyons un lien à usage unique. Ton mot de passe ne change jamais sans ce lien.</Text>
              <TextInput style={styles.input} value={resetEmail} onChangeText={setResetEmail} placeholder="Email" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
              <Pressable accessibilityRole="button" accessibilityLabel="Envoyer le lien" accessibilityState={{ disabled: resetBusy, busy: resetBusy }} style={styles.primaryButton} onPress={handleResetPassword} disabled={resetBusy}>
                <Text style={styles.primaryButtonText}>{resetBusy ? 'Envoi...' : 'Envoyer le lien'}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1, backgroundColor: colors.bgDeep },
  content: { flexGrow: 1, paddingBottom: 32, gap: 18 },
  brand: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orange, letterSpacing: 4 },
  form: { gap: 12 },
  input: { borderRadius: 18, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 14, paddingVertical: 14, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.text },
  error: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.red, textAlign: 'center' },
  primaryButton: { borderRadius: 18, backgroundColor: colors.orange, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.black },
  secondaryButton: { borderRadius: 18, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, paddingVertical: 15, alignItems: 'center' },
  secondaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.text },
  linkButton: { alignItems: 'center', paddingVertical: 6 },
  linkText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textMuted },
  devBlock: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  devTile: {},
  devActive: { borderColor: colors.orange, backgroundColor: colors.accentWash },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(17,17,17,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalScrim: { ...StyleSheet.absoluteFill },
  modalCard: { width: '100%', borderRadius: 28, backgroundColor: colors.card, padding: 18, gap: 12 },
  modalTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text },
  modalCopy: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary },
});
