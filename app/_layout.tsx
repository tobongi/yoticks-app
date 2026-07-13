import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { AuthProvider } from '../src/auth';
import { I18nProvider } from '../src/i18n';
import { ensureNotificationPermissions } from '../src/notifications';
import { SavedEventsProvider } from '../src/saved-events';
import { useEffect } from 'react';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    void ensureNotificationPermissions();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <I18nProvider>
        <AuthProvider>
          <SavedEventsProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/register" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(organizer)" />
              <Stack.Screen name="platform" options={{ presentation: 'card' }} />
              <Stack.Screen name="reserver/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="checkout/[sessionId]" options={{ presentation: 'card' }} />
              <Stack.Screen name="event/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="ticket/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
            </Stack>
          </SavedEventsProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
