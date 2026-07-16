import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Speech from 'expo-speech';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Pictogram } from './pictograms';
import { buildSpokenGuidance } from './spoken-guidance';

export function SpeakButton({ instruction, label = 'Écouter' }: { instruction: string; label?: string }) {
  const [speaking, setSpeaking] = useState(false);

  async function speak() {
    const guidance = buildSpokenGuidance(instruction);
    await Speech.stop();
    setSpeaking(true);
    Speech.speak(guidance.text, {
      language: guidance.language,
      rate: guidance.rate,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${instruction}`}
      accessibilityState={{ busy: speaking }}
      onPress={() => void speak()}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Pictogram pictogram="speaker" tone="blue" size={38} />
      <Text style={styles.label}>{speaking ? 'Écoute…' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceBlue,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  label: { color: colors.blue, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm },
});
