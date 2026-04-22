import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius, typography } from '../../lib/theme';
import { roleLabelFromLevel } from '../../lib/roles';

export default function More() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function confirmLogout() {
    Alert.alert(
      'Sign out?',
      'You will need to sign in again to access the admin app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.title}>More</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{roleLabelFromLevel(user?.accessLevel)}</Text>
              </View>
              {user?.department && (
                <View style={[styles.badge, { backgroundColor: colors.surface2 }]}>
                  <Text style={styles.badgeText}>{user.department}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Organization</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Org</Text>
            <Text style={styles.rowValue}>{user?.orgName || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Title</Text>
            <Text style={styles.rowValue}>{user?.staffRole || '—'}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Access Level</Text>
            <Text style={styles.rowValue}>{user?.accessLevel ?? '—'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Helios Admin · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.h1, marginBottom: spacing.xl },
  profileCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.bg, fontWeight: '700', fontSize: 20, letterSpacing: 1 },
  name: { ...typography.h3 },
  email: { ...typography.bodyMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.bg, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.label,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...typography.bodyMuted },
  rowValue: { ...typography.body, fontWeight: '500' },

  logoutBtn: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  version: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg },
});
