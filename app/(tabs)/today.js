import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { colors, spacing, typography } from '../../lib/theme';
import { roleLabelFromLevel } from '../../lib/roles';

export default function Today() {
  const { user } = useAuth();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>
          {roleLabelFromLevel(user?.accessLevel)} · {user?.department || '—'}
        </Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Today view coming soon. This will show your shift, assigned tasks,
            and department-specific quick actions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodyMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  placeholder: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.xl,
  },
  placeholderText: { ...typography.bodyMuted, lineHeight: 22 },
});
