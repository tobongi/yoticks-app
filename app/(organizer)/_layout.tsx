import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View } from 'react-native';
import { colors } from '../../src/theme/colors';
import { organizerColors } from '../../src/theme/organizer';
import { shadow } from '../../src/theme/shadows';
import { typography } from '../../src/theme/typography';
import { BellIcon, ClipboardIcon, QrIcon, SparkIcon, UserIcon } from '../../src/icons';
import { useAuth } from '../../src/auth';

export default function OrganizerLayout() {
  const { loading, token, user } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    if (user?.role !== 'organizer') {
      router.replace('/(tabs)');
    }
  }, [loading, token, user?.role]);

  if (loading || !token || (token && user?.role !== 'organizer')) {
    return <View style={{ flex: 1, backgroundColor: organizerColors.background }} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 249, 244, 0.94)',
          borderTopColor: organizerColors.border,
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 16,
          paddingTop: 12,
          ...shadow({ color: '#000', opacity: 0.06, radius: 14, offset: { width: 0, height: -6 }, elevation: 8 }),
        },
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: organizerColors.textMuted,
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Pilotage', tabBarIcon: ({ color }) => <SparkIcon size={22} color={color as string} /> }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: 'Events', tabBarIcon: ({ color }) => <ClipboardIcon size={22} color={color as string} /> }}
      />
      <Tabs.Screen
        name="scan"
        options={{ title: 'Scan', tabBarIcon: ({ color }) => <QrIcon size={22} color={color as string} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Compte', tabBarIcon: ({ color }) => <UserIcon size={22} color={color as string} /> }}
      />
      <Tabs.Screen name="brand-kit" options={{ href: null }} />
      <Tabs.Screen name="cities" options={{ href: null }} />
      <Tabs.Screen name="cities/[slug]" options={{ href: null }} />
      <Tabs.Screen name="payouts" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="tickets" options={{ href: null }} />
      <Tabs.Screen name="events/new" options={{ href: null }} />
      <Tabs.Screen name="events/[id]" options={{ href: null }} />
      <Tabs.Screen name="tickets/[id]" options={{ href: null }} />
    </Tabs>
  );
}
