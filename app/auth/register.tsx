import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/auth';
import { ArrowLeftIcon } from '../../src/icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { HeroPanel } from '../../src/ui/lived-in';
import { Pictogram } from '../../src/ui/pictograms';
import { usePhoneLayout } from '../../src/ui/responsive';
import { Screen } from '../../src/ui/screen';

export default function Register() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const auth = useAuth();
  const layout = usePhoneLayout();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setBusy(true);
    setError('');
    try {
      await auth.register(name, email, password);
      router.replace((typeof redirect === 'string' && redirect.trim() ? redirect : '/(tabs)') as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bleed contentStyle={{ paddingTop: layout.authTopPadding }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour a la connexion" style={styles.back} onPress={() => router.back()}>
          <ArrowLeftIcon size={16} color={colors.orangeInk} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
        <HeroPanel eyebrow="Nouveau" title="Créer mon compte" subtitle="Tes billets au même endroit" art={<Pictogram pictogram="profile" tone="blue" size={78} />}>
          <View style={styles.form}>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Telephone" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mot de passe" placeholderTextColor={colors.textMuted} secureTextEntry />
            {!!error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Créer mon compte" accessibilityState={{ disabled: busy, busy }} style={styles.primaryButton} onPress={handleRegister} disabled={busy}>
              <Text style={styles.primaryButtonText}>{busy ? 'Creation...' : 'Créer'}</Text>
            </Pressable>
          </View>
        </HeroPanel>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bgDeep },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.orangeInk },
  form: { gap: 12 },
  input: { borderRadius: 18, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 14, paddingVertical: 14, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.text },
  error: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.red, textAlign: 'center' },
  primaryButton: { borderRadius: 18, backgroundColor: colors.orange, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.black },
});
