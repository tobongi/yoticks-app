import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const MENU_ITEMS = [
  { id: 'orders', label: 'Historique achats', emoji: '📋' },
  { id: 'organizer', label: 'Devenir organisateur', emoji: '🎪' },
  { id: 'notifications', label: 'Notifications', emoji: '🔔' },
  { id: 'language', label: 'Langue', emoji: '🌍', value: 'Français' },
  { id: 'help', label: 'Aide & Support', emoji: '💬' },
  { id: 'about', label: 'À propos de YoTicks', emoji: 'ℹ️' },
];

export default function Profile() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profil</Text>

        {/* Avatar */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Jean Dupont</Text>
            <Text style={styles.profileEmail}>jean.dupont@email.com</Text>
          </View>
          <Pressable style={styles.editBtn}>
            <Text style={styles.editBtnText}>Modifier</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Billets achetés', value: '12' },
            { label: 'Events suivis', value: '5' },
            { label: 'Villes visitées', value: '3' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU_ITEMS.map((item, i) => (
            <Pressable key={item.id} style={[styles.menuItem, i === MENU_ITEMS.length - 1 && styles.menuItemLast]}>
              <Text style={styles.menuEmoji}>{item.emoji}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                <Text style={styles.menuArrow}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={styles.logout} onPress={() => router.replace('/auth/login')}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>

        <View style={styles.version}>
          <Text style={styles.versionText}>YOTICKS v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  pageTitle: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], color: colors.text, marginBottom: 24 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, gap: 14 },
  avatarLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.black },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md, color: colors.text },
  profileEmail: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  editBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.border },
  editBtnText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.text },
  statsRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl, color: colors.orange },
  statLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  menu: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 14 },
  menuItemLast: { borderBottomWidth: 0 },
  menuEmoji: { fontSize: 20 },
  menuLabel: { flex: 1, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.text },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuValue: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textMuted },
  menuArrow: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xl, color: colors.textMuted },
  logout: { backgroundColor: colors.card, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.red + '44' },
  logoutText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.red },
  version: { alignItems: 'center', paddingBottom: 32 },
  versionText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textMuted, letterSpacing: 2 },
});
