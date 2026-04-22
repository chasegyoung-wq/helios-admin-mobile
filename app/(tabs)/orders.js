import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../lib/theme';

export default function Orders() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>Dock cart · POS · pending fulfillment</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Order management coming soon. Will show incoming Dock Cart QR
            orders, POS tickets, and staff fulfillment actions.
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
