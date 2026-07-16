import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { confirmPasswordReset } from '../../src/backend';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { HeroPanel, LivedBackground } from '../../src/ui/lived-in';
import { Pictogram } from '../../src/ui/pictograms';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  const submit = async () => {
    if (!token) return setError('Ce lien est incomplet. Demande un nouveau message.');
    if (password.length < 8) return setError('Utilise au moins 8 caractères.');
    if (password !== confirmation) return setError('Les deux mots de passe ne correspondent pas.');

    setBusy(true);
    setError('');
    try {
      await confirmPasswordReset(token, password);
      setComplete(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Ce lien ne fonctionne plus.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LivedBackground />
        <View style={styles.content}>
          <Text style={styles.brand}>YOTICKS</Text>
          <HeroPanel
            eyebrow={complete ? 'Compte sécurisé' : 'Nouveau mot de passe'}
            title={complete ? 'C’est bon.' : 'Choisis ton nouveau code'}
            subtitle={complete ? 'Ton ancien lien est maintenant inutilisable.' : '8 caractères minimum. Le lien ne marche qu’une fois.'}
            art={<Pictogram pictogram={complete ? 'check' : 'profile'} tone={complete ? 'green' : 'blue'} size={76} />}
          >
            {complete ? (
              <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => router.replace('/auth/login')}>
                <Text style={styles.primaryButtonText}>Me connecter</Text>
              </Pressable>
            ) : (
              <View style={styles.form}>
                <TextInput
                  accessibilityLabel="Nouveau mot de passe"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  textContentType="newPassword"
                />
                <TextInput
                  accessibilityLabel="Confirmer le nouveau mot de passe"
                  style={styles.input}
                  value={confirmation}
                  onChangeText={setConfirmation}
                  placeholder="Confirmer"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  textContentType="newPassword"
                />
                {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
                <Pressable accessibilityRole="button" style={styles.primaryButton} disabled={busy} onPress={() => void submit()}>
                  <Text style={styles.primaryButtonText}>{busy ? 'Changement...' : 'Changer le mot de passe'}</Text>
                </Pressable>
              </View>
            )}
          </HeroPanel>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 20, gap: 18 },
  brand: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orange, letterSpacing: 4 },
  form: { gap: 12 },
  input: { minHeight: 54, borderRadius: 18, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 14, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.text },
  error: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.red },
  primaryButton: { minHeight: 54, borderRadius: 18, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.black },
});
