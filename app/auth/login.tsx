import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { requestPasswordReset } from '../../src/backend';
import { useAuth } from '../../src/auth';
import { getPostAuthRoute } from '../../src/routing';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { radius, space, stroke } from '../../src/theme/tokens';
import { elevation } from '../../src/theme/shadows';
import { ActionTile, Button, SectionBlock } from '../../src/ui/lived-in';
import { Input } from '../../src/ui/form';
import { Screen } from '../../src/ui/screen';
import { useLayout } from '../../src/ui/responsive';
import { Pictogram, TicketStubArt } from '../../src/ui/pictograms';

/**
 * Sign in.
 *
 * Reworked around what people actually arrive here to do. The demo tiles
 * used to sit below the fold underneath a full email/password form, even
 * though for most visitors — and for anyone evaluating the product — they
 * are the fastest way in. They now lead, and the credential form sits below
 * for people who own an account.
 *
 * Fields gained persistent labels (a placeholder disappears the moment you
 * type, and is not exposed as an accessible name), error text that is
 * announced rather than only coloured, and a real busy state.
 */
export default function Login() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const auth = useAuth();
  const layout = useLayout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingRole, setPendingRole] = useState<'attendee' | 'organizer' | null>(null);
  const [resetVisible, setResetVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const goNext = (role: 'attendee' | 'organizer') => {
    router.replace(getPostAuthRoute({ redirect, role }) as never);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Entre ton email et ton mot de passe.');
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
    setPendingRole(role);
    setError('');
    try {
      await auth.devLogin(role);
      goNext(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setBusy(false);
      setPendingRole(null);
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bleed contentStyle={{ paddingTop: layout.authTopPadding }}>
        <View style={styles.brandRow}>
          <View style={styles.brandCopy}>
            <Text style={styles.brand}>YOTICKS</Text>
            <Text style={styles.brandTitle}>Retrouve tes billets</Text>
          </View>
          <TicketStubArt size={84} />
        </View>

        <SectionBlock eyebrow="Essayer" title="Entrer en un tap">
          <View style={styles.demoRow}>
            <ActionTile
              icon={<Pictogram pictogram="profile" tone="blue" size={40} />}
              label="Visiteur"
              hint="Voir les sorties"
              tone="blue"
              accessibilityLabel="Entrer en démo comme visiteur"
              onPress={() => void handleDevLogin('attendee')}
              style={[styles.demoTile, pendingRole === 'attendee' && styles.demoTileBusy]}
            />
            <ActionTile
              icon={<Pictogram pictogram="scan" tone="green" size={40} />}
              label="Organisateur"
              hint="Scanner l’entrée"
              tone="green"
              accessibilityLabel="Entrer en démo comme organisateur"
              onPress={() => void handleDevLogin('organizer')}
              style={[styles.demoTile, pendingRole === 'organizer' && styles.demoTileBusy]}
            />
          </View>
        </SectionBlock>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou avec ton compte</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="nom@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            error={error || undefined}
          />

          <Button label="Entrer" onPress={handleLogin} loading={busy && !pendingRole} buttonSize="lg" />
          <Button label="Créer un compte" variant="secondary" onPress={() => router.push('/auth/register')} />
          <Button
            label="Mot de passe oublié"
            variant="ghost"
            buttonSize="sm"
            accessibilityLabel="Ouvrir la réinitialisation du mot de passe"
            onPress={() => {
              setResetEmail(email);
              setResetVisible(true);
            }}
          />
        </View>
      </Screen>

      <Modal visible={resetVisible} transparent animationType="fade" onRequestClose={() => setResetVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer la fenêtre de réinitialisation"
            style={styles.modalScrim}
            onPress={() => setResetVisible(false)}
          />
          <View style={[styles.modalCard, { maxWidth: layout.modalCardWidth }]}>
            <Text style={styles.modalTitle}>Retrouver mon compte</Text>
            <Text style={styles.modalCopy}>On envoie un lien valable 30 minutes.</Text>
            <Input
              label="Email"
              value={resetEmail}
              onChangeText={setResetEmail}
              placeholder="nom@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button label="Envoyer le lien" onPress={handleResetPassword} loading={resetBusy} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bgDeep },

  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  brandCopy: { flex: 1, gap: space.xs },
  brand: { ...typography.text.eyebrow, color: colors.orangeInk, letterSpacing: 3 },
  brandTitle: {
    ...typography.text.display,
    fontSize: typography.fontSize['2xl'],
    lineHeight: 36,
    color: colors.text,
  },

  demoRow: { flexDirection: 'row', gap: space.md },
  demoTile: { flex: 1 },
  demoTileBusy: { opacity: 0.6 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dividerLine: { flex: 1, height: stroke.hairline, backgroundColor: colors.border },
  dividerText: { ...typography.text.meta, color: colors.textMuted },

  form: { gap: space.md },

  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  modalScrim: { ...StyleSheet.absoluteFill },
  modalCard: {
    width: '100%',
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    padding: space.xl,
    gap: space.lg,
    ...elevation.xl,
  },
  modalTitle: { ...typography.text.heading, color: colors.text },
  modalCopy: { ...typography.text.body, color: colors.textSecondary },
});
