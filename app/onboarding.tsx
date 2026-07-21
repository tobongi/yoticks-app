import { useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../src/auth';
import { FALLBACK_EVENTS } from '../src/backend';
import { groupEventsByCity } from '../src/cities';
import { saveOnboardingPreferences } from '../src/onboarding-prefs';
import { getSignedInRoute } from '../src/routing';
import { markTutorialSeen } from '../src/tutorial';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { HeroPanel, SectionBlock } from '../src/ui/lived-in';
import { Pictogram, PictogramLabel, TicketStubArt } from '../src/ui/pictograms';
import { getCategoryVisual } from '../src/ui/visual-language';
import { SpeakButton } from '../src/ui/speak-button';
import { CenteredColumn } from '../src/ui/screen';
import { ImageScrim } from '../src/ui/image-scrim';

const interests = Array.from(new Set(FALLBACK_EVENTS.map((event) => event.category)));
const cities = groupEventsByCity(FALLBACK_EVENTS).map((entry) => entry.label);

export default function Onboarding() {
  const { token, user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(cities[0] ?? null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  const animateTransition = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ]).start();
    });
  };

  const nextStep = () => {
    if (step < 3) animateTransition(step + 1);
    else finish();
  };

  const prevStep = () => {
    if (step > 0) animateTransition(step - 1);
  };

  const preview = useMemo(() => {
    return (
      FALLBACK_EVENTS.filter((event) => {
        const categoryMatch = selectedInterests.length === 0 || selectedInterests.includes(event.category);
        const cityMatch = !selectedCity || event.location === selectedCity;
        return categoryMatch && cityMatch;
      })[0] ?? FALLBACK_EVENTS[0]
    );
  }, [selectedCity, selectedInterests]);
  const previewVisual = getCategoryVisual(preview.category);

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
    if (busy) return;
    setBusy(true);
    try {
      await saveOnboardingPreferences({ interests: selectedInterests.map((item) => item.toLowerCase()), city: selectedCity });
      await markTutorialSeen();
      router.replace((token ? getSignedInRoute(user?.role) : '/auth/login') as never);
    } finally {
      setBusy(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <HeroPanel eyebrow="Bienvenue" title="Trouve les meilleurs plans" subtitle="On t'accompagne pas à pas." art={<TicketStubArt size={120} />}>
            <View style={styles.stepRow}>
              <PictogramLabel pictogram="music" label="Style" size={48} />
              <PictogramLabel pictogram="map" tone="yellow" label="Ville" size={48} />
              <PictogramLabel pictogram="ticket" tone="blue" label="Billet" size={48} />
            </View>
            <SpeakButton instruction="Bienvenue sur Yoticks ! Prépare-toi à découvrir les meilleurs événements de ta ville." />
          </HeroPanel>
        );
      case 1:
        return (
          <SectionBlock eyebrow="Etape 1" title="Qu'est-ce que tu aimes ?">
            <Text style={styles.subtitle}>Sélectionne jusqu'à 3 styles pour personnaliser ton fil d'actualité.</Text>
            <View style={styles.wrap}>
              {interests.map((interest) => { const visual = getCategoryVisual(interest); return <ChoiceChip key={interest} label={visual.label} pictogram={<Pictogram pictogram={visual.key} tone={visual.tone} size={44} />} active={selectedInterests.includes(interest)} onPress={() => toggleInterest(interest)} />; })}
            </View>
          </SectionBlock>
        );
      case 2:
        return (
          <SectionBlock eyebrow="Etape 2" title="Où tu bouges ?">
            <Text style={styles.subtitle}>Choisis ta ville principale pour trouver les événements près de toi.</Text>
            <View style={styles.wrap}>
              {cities.map((city) => (
                <ChoiceChip key={city} label={city} pictogram={<Pictogram pictogram="map" tone="yellow" size={40} />} active={city === selectedCity} onPress={() => setSelectedCity(city)} />
              ))}
            </View>
          </SectionBlock>
        );
      case 3:
        return (
          <SectionBlock eyebrow="Terminé" title="Ton premier plan !">
            <Text style={styles.subtitle}>Voici un aperçu de ce qu'on a trouvé pour toi.</Text>
            <View style={styles.previewCard}>
              <ImageBackground source={{ uri: preview.imageUrl }} style={styles.previewVisual} imageStyle={styles.previewImage}>
                <ImageScrim id="onboarding" />
                <View style={styles.previewPrice}>
                  <Text style={styles.previewPriceText}>{preview.price}</Text>
                </View>
                <View style={styles.previewIconWrap}>
                  <Pictogram pictogram={previewVisual.key} tone={previewVisual.tone} size={48} />
                </View>
              </ImageBackground>
              <View style={styles.previewBody}>
                <Text style={styles.previewTitle}>{preview.title}</Text>
                <Text style={styles.previewCategory}>{preview.category}</Text>
                <Text style={styles.previewMeta}>{preview.location} • {preview.date}</Text>
              </View>
            </View>
          </SectionBlock>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <CenteredColumn style={styles.header}>
        {step > 0 ? (
          <Pressable onPress={prevStep} style={styles.backButton} accessibilityLabel="Retour">
            <Text style={styles.backText}>← Retour</Text>
          </Pressable>
        ) : <View style={styles.backSpacer} />}
        <Text style={styles.brand}>YOTICKS</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{step + 1} / 4</Text>
        </View>
      </CenteredColumn>
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CenteredColumn>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {renderStep()}
          </Animated.View>
        </CenteredColumn>
      </ScrollView>

      <CenteredColumn style={styles.footer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 4) * 100}%` }]} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={step === 3 ? "Commencer" : "Continuer"} accessibilityState={{ disabled: busy, busy }} style={[styles.primaryButton, busy && styles.primaryButtonDisabled]} onPress={nextStep} disabled={busy}>
          <Text style={styles.primaryButtonText}>{busy ? '...' : (step === 3 ? "C'est parti !" : "Continuer")}</Text>
        </Pressable>
      </CenteredColumn>
    </SafeAreaView>
  );
}

function ChoiceChip({ label, pictogram, active, onPress }: { label: string; pictogram: React.ReactNode; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={onPress}>
      {pictogram}
      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  brand: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orangeInk, letterSpacing: 4 },
  backButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.cardHover },
  backText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, color: colors.textSecondary },
  backSpacer: { width: 60 },
  stepIndicator: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.card },
  stepText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xs, color: colors.orangeInk },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 112, gap: 18 },
  subtitle: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.md, color: colors.textSecondary, marginBottom: 16, lineHeight: 22 },
  stepRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choiceChip: {
    minHeight: 52,
    borderRadius: 999,
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
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
    minHeight: 164,
    borderRadius: 22,
    backgroundColor: colors.cardHover,
    padding: 12,
    justifyContent: 'space-between',
  },
  previewImage: { borderRadius: 22 },
  previewPrice: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 7 },
  previewPriceText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.text },
  previewIconWrap: { alignSelf: 'flex-end', width: 52, height: 52, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  previewBody: { gap: 4 },
  previewTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.text },
  previewCategory: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.orangeInk },
  previewMeta: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.textSecondary },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  progressTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.orange },
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
