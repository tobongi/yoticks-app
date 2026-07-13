import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { useAuth } from '../../src/auth';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { MapIcon, SearchIcon, TicketIcon, UserIcon } from '../../src/icons';

export default function TabsLayout() {
  const { loading, token, user } = useAuth();

  useEffect(() => {
    if (!loading && token && user?.role === 'organizer') {
      router.replace('/(organizer)' as never);
    }
  }, [loading, token, user?.role]);

  if (loading || (token && user?.role === 'organizer')) {
    return <></>;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          height: 74,
          borderRadius: 24,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          paddingTop: 10,
          paddingBottom: 10,
          elevation: 0,
          shadowOpacity: 0.14,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 6 },
        },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.semiBold,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Sortir', tabBarIcon: ({ color }) => <SearchIcon size={22} color={color as string} /> }} />
      <Tabs.Screen name="tickets" options={{ title: 'QR', tabBarIcon: ({ color }) => <TicketIcon size={22} color={color as string} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Trouver', tabBarIcon: ({ color }) => <MapIcon size={22} color={color as string} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Moi', tabBarIcon: ({ color }) => <UserIcon size={22} color={color as string} /> }} />
    </Tabs>
  );
}
