// Dashboard — live ops summary. Pulls from GET /api/dashboard/stats.
// Keep card selection tight: this is a 7am morning-check-in view, not a report.

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { apiGet } from '../../lib/api';
import { colors, spacing, radius, typography } from '../../lib/theme';
import { roleLabelFromLevel } from '../../lib/roles';

function formatMoney(n) {
  const v = Number(n || 0);
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet('/dashboard/stats');
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <Text style={styles.hi}>{greeting()}, {user?.firstName}</Text>
        <Text style={styles.role}>
          {roleLabelFromLevel(user?.accessLevel)}
          {user?.department ? ` · ${user.department}` : ''}
          {user?.orgName ? ` · ${user.orgName}` : ''}
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.gridRow}>
          <StatCard
            icon="people-outline"
            label="Active Members"
            value={stats?.members?.active ?? '—'}
          />
          <StatCard
            icon="boat-outline"
            label="Dock Occupancy"
            value={stats ? `${stats?.marina?.pct ?? 0}%` : '—'}
            sub={stats ? `${stats?.marina?.occupied ?? 0}/${stats?.marina?.total ?? 0} slips` : null}
          />
        </View>

        <View style={styles.gridRow}>
          <StatCard
            icon="restaurant-outline"
            label="Dining Today"
            value={stats?.dining?.todayReservations ?? '—'}
            sub="reservations"
          />
          <StatCard
            icon="bed-outline"
            label="Hotel Check-ins"
            value={stats?.hotel?.todayCheckIns ?? '—'}
            sub="today"
          />
        </View>

        <View style={styles.gridRow}>
          <StatCard
            icon="cash-outline"
            label="POS Revenue"
            value={stats ? formatMoney(stats?.pos?.todayRevenue) : '—'}
            sub="today"
            accent
          />
          <StatCard
            icon="construct-outline"
            label="Work Orders"
            value={stats?.maintenance?.openWorkOrders ?? '—'}
            sub="open"
          />
        </View>

        <View style={styles.secondarySection}>
          <Text style={styles.sectionLabel}>Also watching</Text>
          <InlineStat label="Upcoming events (7d)" value={stats?.events?.upcoming} />
          <InlineStat label="Pending BEOs"          value={stats?.catering?.pendingBeos} />
          <InlineStat label="Open HOA violations"   value={stats?.hoa?.openViolations} />
          <InlineStat label="Active pipeline leads" value={stats?.pipeline?.activeLeads} />
          <InlineStat label="Open volunteer spots"  value={stats?.volunteers?.openOpportunities} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={18} color={accent ? colors.bg : colors.textMuted} />
        <Text style={[styles.cardLabel, accent && { color: colors.bg, opacity: 0.85 }]}>{label}</Text>
      </View>
      <Text style={[styles.cardValue, accent && { color: colors.bg }]}>{value}</Text>
      {sub && <Text style={[styles.cardSub, accent && { color: colors.bg, opacity: 0.7 }]}>{sub}</Text>}
    </View>
  );
}

function InlineStat({ label, value, last }) {
  return (
    <View style={[styles.inlineRow, !last && styles.inlineBorder]}>
      <Text style={styles.inlineLabel}>{label}</Text>
      <Text style={styles.inlineValue}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  hi: { ...typography.h1, marginTop: spacing.sm },
  role: { ...typography.bodyMuted, marginTop: spacing.xs, marginBottom: spacing.xl },

  gridRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },

  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 110,
  },
  cardAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDim,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cardLabel: { ...typography.label, flex: 1 },
  cardValue: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  cardSub: { ...typography.caption, marginTop: 2 },

  secondarySection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inlineBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inlineLabel: { ...typography.bodyMuted, fontSize: 14 },
  inlineValue: { ...typography.body, fontWeight: '600', color: colors.accent },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#3a1a1a',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
});
