import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_PREFS_KEY = 'yoticks.onboarding_preferences';

export type OnboardingPreferences = {
  interests: string[];
  city: string | null;
  savedAt: string;
};

export type OnboardingPreferencesInput = {
  interests: string[];
  city: string | null;
};

function normalizeSelection(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)));
}

export async function getOnboardingPreferences(): Promise<OnboardingPreferences | null> {
  const raw = await AsyncStorage.getItem(ONBOARDING_PREFS_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingPreferences>;
    const interests = normalizeSelection(Array.isArray(parsed.interests) ? parsed.interests : []);
    const city = typeof parsed.city === 'string' && parsed.city.trim() ? parsed.city.trim() : null;

    if (!interests.length && !city) {
      return null;
    }

    return {
      interests,
      city,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveOnboardingPreferences(input: OnboardingPreferencesInput) {
  const payload: OnboardingPreferences = {
    interests: normalizeSelection(input.interests),
    city: input.city?.trim() ? input.city.trim() : null,
    savedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(ONBOARDING_PREFS_KEY, JSON.stringify(payload));
  return payload;
}

