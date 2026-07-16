import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { listNotifications, markNotificationRead, type BackendNotification } from '../src/backend';
import { useAuth } from '../src/auth';
import { ArrowLeftIcon, ChevronRightIcon } from '../src/icons';
import { LivedBackground, PrimaryAction, ScreenHeader } from '../src/ui/lived-in';
import { Pictogram, VisualState } from '../src/ui/pictograms';

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    listNotifications(token ?? undefined)
      .then((notifications) => {
        if (active) setItems(notifications);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey, token]);

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
      <LivedBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.back} onPress={() => router.back()}><ArrowLeftIcon size={18} color={colors.orange} /><Text style={styles.backText}>Retour</Text></Pressable>
        <ScreenHeader eyebrow="Alertes" title="À ne pas rater" side={<Pictogram pictogram="bell" size={58} />} />

        <View style={styles.list}>
          {loading ? (
            <View style={styles.stateCard} accessibilityRole="progressbar">
              <Pictogram pictogram="bell" size={88} />
              <ActivityIndicator color={colors.orange} />
            </View>
          ) : null}
          {!loading && error ? (
            <View style={styles.stateCard}><VisualState art={<Pictogram pictogram="blocked" tone="red" size={92} />} title="Pas de connexion" action={<PrimaryAction label="Réessayer" pictogram="history" onPress={() => setReloadKey((key) => key + 1)} />} /></View>
          ) : null}
          {!loading && !error && items.length === 0 ? (
            <View style={styles.stateCard}><VisualState art={<Pictogram pictogram="check" tone="green" size={92} />} title="Tout est vu" /></View>
          ) : null}
          {items.map((item) => {
            const unread = !item.readAt;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.body}`} key={item.id} style={[styles.card, unread && styles.cardUnread]} onPress={() => void handleOpen(item)}>
                <View style={styles.iconWrap}>
                  <Pictogram pictogram="bell" size={44} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {unread ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.cardText} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
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
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  container: { flex: 1 },
  content: { padding: 20, gap: 14 },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.orange },
  list: { gap: 10 },
  stateCard: {
    minHeight: 150,
    padding: 24,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stateTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: colors.text,
    textAlign: 'center',
  },
  stateText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
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
    width: 48,
    height: 48,
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
