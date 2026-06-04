import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Retour</Text>
          </Pressable>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez YoTicks et ne ratez plus aucun event.</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Nom complet', value: name, set: setName, placeholder: 'Jean Dupont', type: 'default' },
            { label: 'Email', value: email, set: setEmail, placeholder: 'votre@email.com', type: 'email-address' },
            { label: 'Téléphone', value: phone, set: setPhone, placeholder: '+243 8X XXX XXXX', type: 'phone-pad' },
            { label: 'Mot de passe', value: password, set: setPassword, placeholder: '••••••••', type: 'default', secure: true },
          ].map((field) => (
            <View key={field.label} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.set}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={field.type as any}
                secureTextEntry={field.secure}
                autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                autoCorrect={false}
              />
            </View>
          ))}
        </View>

        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.buttonText}>Créer mon compte</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, gap: 32 },
  header: { gap: 8 },
  back: { marginBottom: 16 },
  backText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.orange },
  title: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], color: colors.text },
  subtitle: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textSecondary },
  form: { gap: 16 },
  field: { gap: 8 },
  label: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md, color: colors.black },
});
