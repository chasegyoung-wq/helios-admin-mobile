import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../lib/theme';

export default function Alerts() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>Notifications · system events</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Alerts feed coming soon. Will show new feedback tickets, guest
            card approvals, compliance flags, and push-triggered events.
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
