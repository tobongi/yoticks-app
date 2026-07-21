import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { organizerColors } from '../../src/theme/organizer';
import { shadow } from '../../src/theme/shadows';
import { typography } from '../../src/theme/typography';
import { useAuth } from '../../src/auth';
import { Pictogram } from '../../src/ui/pictograms';
import type { PictogramKey, VisualTone } from '../../src/ui/visual-language';
import { Screen } from '../../src/ui/screen';

export default function OrganizerProfile() {
  const { user, signOut } = useAuth();

  const initials = (user?.name ?? 'Organizer')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Screen bleed>
      <Text style={styles.kicker}>ORGANISATEUR</Text>
      <Text style={styles.title}>Mon compte</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>MODE ORGANISATEUR</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionList}>
        <Action pictogram="art" tone="orange"
          label="Mon image"
          value="Logo et couleurs"
          onPress={() => router.push('/(organizer)/brand-kit' as never)}
        />
        <Action pictogram="ticket" tone="green" label="Paiements" value="Compte marchand" onPress={() => router.push('/(organizer)/payouts' as never)} />
        <Action pictogram="help" tone="blue" label="Aide" value="Contacter YoTicks" onPress={() => router.push('/(organizer)/support' as never)} />
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Se déconnecter"
        style={styles.logout}
        onPress={() => {
          signOut();
          router.replace('/auth/login');
        }}
      >
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </Screen>
  );
}

function Action({ pictogram, tone, label, value, onPress }: { pictogram: PictogramKey; tone: VisualTone; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={styles.actionCard} onPress={onPress}>
      <Pictogram pictogram={pictogram} tone={tone} size={52} />
      <View style={styles.actionCopy}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionValue}>{value}</Text>
      </View>
      <Text style={styles.actionArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
  },
  title: { fontFamily: typography.fontFamily.bold, fontSize: 28, lineHeight: 34, color: organizerColors.text },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 28,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.border,
    ...shadow({ color: '#000', opacity: 0.06, radius: 18, offset: { width: 0, height: 8 }, elevation: 3 }),
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
  avatarText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, color: colors.black },
  profileCopy: { flex: 1, gap: 4 },
  name: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md, color: organizerColors.text },
  email: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: organizerColors.textSecondary },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: organizerColors.warningSoft,
  },
  roleText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.orangeInk,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  actionList: { gap: 10 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    backgroundColor: organizerColors.surface,
    borderWidth: 1,
    borderColor: organizerColors.border,
  },
  actionCopy: { flex: 1, gap: 4 },
  actionLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: organizerColors.text },
  actionValue: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: organizerColors.textSecondary,
  },
  actionArrow: { fontFamily: typography.fontFamily.bold, fontSize: 24, color: colors.orangeInk, lineHeight: 24 },
  logout: {
    marginTop: 6,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: organizerColors.accentSoft,
    borderWidth: 1,
    borderColor: organizerColors.borderStrong,
  },
  logoutText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.sm, color: colors.orangeInk },
});
