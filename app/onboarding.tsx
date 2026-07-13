import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../src/auth';
import { FALLBACK_EVENTS } from '../src/backend';
import { groupEventsByCity } from '../src/cities';
import { saveOnboardingPreferences } from '../src/onboarding-prefs';
import { getSignedInRoute } from '../src/routing';
import { markTutorialSeen } from '../src/tutorial';
import { CalendarIcon, PinIcon, SparkIcon, TicketIcon } from '../src/icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { HeroPanel, LivedBackground, SectionBlock } from '../src/ui/lived-in';

const interests = Array.from(new Set(FALLBACK_EVENTS.map((event) => event.category)));
const cities = groupEventsByCity(FALLBACK_EVENTS).map((entry) => entry.label);

export default function Onboarding() {
  const { token, user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(cities[0] ?? null);
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => {
    return (
      FALLBACK_EVENTS.filter((event) => {
        const categoryMatch = selectedInterests.length === 0 || selectedInterests.includes(event.category);
        const cityMatch = !selectedCity || event.location === selectedCity;
        return categoryMatch && cityMatch;
      })[0] ?? FALLBACK_EVENTS[0]
    );
  }, [selectedCity, selectedInterests]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : current.length >= 3
          ? [...current.slice(1), interest]
          : [...current, interest],
    );
  };

  const finish = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await saveOnboardingPreferences({ interests: selectedInterests.map((item) => item.toLowerCase()), city: selectedCity });
      await markTutorialSeen();
      router.replace((token ? getSignedInRoute(user?.role) : '/auth/login') as never);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <LivedBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>YOTICKS</Text>

        <HeroPanel
          eyebrow="Bienvenue"
          title="On te montre les bons plans"
          subtitle="Choisis juste le style et la ville."
          art={<SparkIcon size={30} color={colors.orange} />}
        >
          <View style={styles.stepRow}>
            <StepPill icon={<TicketIcon size={14} color={colors.orange} />} label="Style" />
            <StepPill icon={<PinIcon size={14} color={colors.orange} />} label="Ville" />
            <StepPill icon={<CalendarIcon size={14} color={colors.orange} />} label="Sorties" />
          </View>
        </HeroPanel>

        <SectionBlock eyebrow="Style" title="Ce que tu aimes">
          <View style={styles.wrap}>
            {interests.map((interest) => (
              <ChoiceChip
                key={interest}
                label={interest}
                active={selectedInterests.includes(interest)}
                onPress={() => toggleInterest(interest)}
              />
            ))}
          </View>
        </SectionBlock>

        <SectionBlock eyebrow="Ville" title="Ou tu bouges">
          <View style={styles.wrap}>
            {cities.map((city) => (
              <ChoiceChip key={city} label={city} active={city === selectedCity} onPress={() => setSelectedCity(city)} />
            ))}
          </View>
        </SectionBlock>

        <SectionBlock eyebrow="Apercu" title="Ce qui peut sortir">
          <View style={styles.previewCard}>
            <View style={styles.previewVisual}>
              <View style={styles.previewPrice}>
                <Text style={styles.previewPriceText}>{preview.price}</Text>
              </View>
              <View style={styles.previewIconWrap}>
                <SparkIcon size={30} color={colors.orange} />
              </View>
            </View>
            <View style={styles.previewBody}>
              <Text style={styles.previewTitle}>{preview.title}</Text>
              <Text style={styles.previewCategory}>{preview.category}</Text>
              <Text style={styles.previewMeta}>{preview.location} • {preview.date}</Text>
            </View>
          </View>
        </SectionBlock>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={[styles.primaryButton, busy && styles.primaryButtonDisabled]} onPress={finish} disabled={busy}>
          <Text style={styles.primaryButtonText}>{busy ? '...' : 'Continuer'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function StepPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.stepPill}>
      {icon}
      <Text style={styles.stepText}>{label}</Text>
    </View>
  );
}

function ChoiceChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={onPress}>
      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 112, gap: 18 },
  brand: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orange, letterSpacing: 4 },
  stepRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  stepPill: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choiceChip: {
    minHeight: 52,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
  },
  choiceChipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  choiceChipText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.textSecondary },
  choiceChipTextActive: { color: colors.black, fontFamily: typography.fontFamily.semiBold },
  previewCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 14,
    gap: 10,
  },
  previewVisual: {
    minHeight: 92,
    borderRadius: 22,
    backgroundColor: colors.cardHover,
    padding: 12,
    justifyContent: 'space-between',
  },
  previewPrice: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 7 },
  previewPriceText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  previewIconWrap: { alignSelf: 'flex-end', width: 52, height: 52, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  previewBody: { gap: 4 },
  previewTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text },
  previewCategory: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.orange },
  previewMeta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.textSecondary },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: 'rgba(248,241,236,0.94)',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md, color: colors.black },
});
