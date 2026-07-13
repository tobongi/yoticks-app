import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { listNotifications, markNotificationRead, type BackendNotification } from '../src/backend';
import { useAuth } from '../src/auth';
import { BellIcon, ChevronRightIcon } from '../src/icons';

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<BackendNotification[]>([]);

  useEffect(() => {
    listNotifications(token ?? undefined).then(setItems);
  }, [token]);

  async function handleOpen(item: BackendNotification) {
    const updated = await markNotificationRead(item.id, token ?? undefined);
    if (updated) {
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
    }

    if (item.data.url?.startsWith('/event/')) {
      const id = item.data.url.split('/').pop();
      if (id) {
        router.push({ pathname: '/event/[id]', params: { id } });
        return;
      }
    }

    if (item.data.url === '/(tabs)/tickets') {
      router.push('/(tabs)/tickets');
      return;
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Activity center</Text>
        <Text style={styles.title}>Notifications and reminders</Text>
        <Text style={styles.copy}>Ticket confirmations, event reminders, organizer updates, and gate changes all land here.</Text>

        <View style={styles.list}>
          {items.map((item) => {
            const unread = !item.readAt;
            return (
              <Pressable key={item.id} style={[styles.card, unread && styles.cardUnread]} onPress={() => void handleOpen(item)}>
                <View style={styles.iconWrap}>
                  <BellIcon size={16} color={colors.orange} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {unread ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.cardText}>{item.body}</Text>
                  <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                <ChevronRightIcon size={14} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20, gap: 14 },
  kicker: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.text,
  },
  copy: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: {
    borderColor: colors.orange,
    backgroundColor: colors.accentWash,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardHover,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  cardText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardMeta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
});
