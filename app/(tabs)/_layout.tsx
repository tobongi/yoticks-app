import { useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useAuth } from '../../src/auth';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { elevation } from '../../src/theme/shadows';
import { radius, size, space } from '../../src/theme/tokens';
import { MapIcon, SearchIcon, TicketIcon, UserIcon } from '../../src/icons';
import { useLayout } from '../../src/ui/responsive';

/**
 * Bottom navigation.
 *
 * Two fixes over the previous version:
 *
 * 1. It was pinned with `left: 12, right: 12`, so on a desktop browser the
 *    bar stretched the full 1440px with four icons marooned in the middle.
 *    It is now capped to the same column width as page content, so the app
 *    reads as one object at every size.
 *
 * 2. Tab order followed file order rather than task order — search sat
 *    fourth despite being the second thing anyone does. The order is now the
 *    actual journey: find something, look at what you hold, then your
 *    account. "QR" also became "Billets", because the tab is the list of
 *    tickets and the QR code lives one level deeper.
 */
export default function TabsLayout() {
  const { loading, token, user } = useAuth();
  const layout = useLayout();

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
        tabBarActiveTintColor: colors.orangeInk,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: space.md,
          // Centres the bar inside the same column the page content uses.
          marginHorizontal: 'auto',
          maxWidth: layout.contentMaxWidth - space.lg * 2,
          height: size.tabBar,
          borderRadius: radius.xl,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          paddingTop: space.sm,
          paddingBottom: space.sm,
          ...elevation.lg,
        },
        tabBarItemStyle: {
          // Keeps every tab at the WCAG target size regardless of label length.
          minHeight: size.touchMin,
          borderRadius: radius.md,
        },
        tabBarLabelStyle: {
          ...typography.text.caption,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sortir',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <SearchIcon size={size.iconLg} color={color as string} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Trouver',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MapIcon size={size.iconLg} color={color as string} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Billets',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <TicketIcon size={size.iconLg} color={color as string} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Moi',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <UserIcon size={size.iconLg} color={color as string} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

/**
 * The active tab gets a tinted pill behind the glyph as well as a colour
 * change. Colour alone is not allowed to carry state — PRODUCT.md says so,
 * and it is the difference between usable and not for anyone with a colour
 * vision deficiency.
 */
function TabIcon({ focused, children }: { focused: boolean; children: ReactNode }) {
  return <View style={[styles.tabIcon, focused && styles.tabIconActive]}>{children}</View>;
}

const styles = StyleSheet.create({
  tabIcon: {
    minWidth: 52,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { transitionDuration: '160ms' } as object, default: {} }),
  },
  tabIconActive: {
    backgroundColor: colors.surfaceOrange,
  },
});
