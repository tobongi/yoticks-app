import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth';
import { ArrowLeftIcon, SparkIcon } from '../../src/icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { HeroPanel, LivedBackground } from '../../src/ui/lived-in';
import { usePhoneLayout } from '../../src/ui/responsive';

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LivedBackground />
        <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: layout.screenPadding, paddingTop: layout.authTopPadding }]} showsVerticalScrollIndicator={false}>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour a la connexion" style={styles.back} onPress={() => router.back()}>
            <ArrowLeftIcon size={16} color={colors.orange} />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <HeroPanel eyebrow="Nouveau" title="Creer mon compte" subtitle="Un compte. Tous les billets." art={<SparkIcon size={38} color={colors.orange} />}>
            <View style={styles.form}>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom" placeholderTextColor={colors.textMuted} />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Telephone" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mot de passe" placeholderTextColor={colors.textMuted} secureTextEntry />
              {!!error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable style={styles.primaryButton} onPress={handleRegister} disabled={busy}>
                <Text style={styles.primaryButtonText}>{busy ? 'Creation...' : 'Creer'}</Text>
              </Pressable>
            </View>
          </HeroPanel>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1, backgroundColor: colors.bgDeep },
  content: { flexGrow: 1, paddingBottom: 32, gap: 18 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.orange },
  form: { gap: 12 },
  input: { borderRadius: 18, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 14, paddingVertical: 14, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.text },
  error: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.red, textAlign: 'center' },
  primaryButton: { borderRadius: 18, backgroundColor: colors.orange, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.black },
});
