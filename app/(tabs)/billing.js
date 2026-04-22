// Billing — accounting snapshot for admin & director.
// Pulls from GET /api/billing/summary. Requires accessLevel >= 4 (enforced server-side).

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../../lib/api';
import { colors, spacing, radius, typography } from '../../lib/theme';

function money(n, opts = {}) {
  const v = Number(n || 0);
  const abs = Math.abs(v);
  const str = '$' + abs.toLocaleString('en-US', {
    minimumFractionDigits: opts.decimals ?? 0,
    maximumFractionDigits: opts.decimals ?? 0,
  });
  return v < 0 ? `-${str}` : str;
}

function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Billing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiGet('/billing/summary');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load billing summary');
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

  const r = data?.revenue || {};
  const a = data?.aging || {};
  const cats = data?.byCategory || [];
  const recent = data?.recent || [];
  const top = data?.topBalances || [];
  const changePositive = (r.mtdChangePct ?? 0) >= 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <Text style={styles.title}>Billing</Text>
        <Text style={styles.subtitle}>Accounting · AR · revenue</Text>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Revenue cards */}
        <View style={styles.gridRow}>
          <RevCard label="Today"          value={money(r.today)} count={r.todayCount} />
          <RevCard label="Week to date"   value={money(r.wtd)}   count={r.wtdCount} />
        </View>
        <View style={[styles.mtdCard]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mtdLabel}>Month to date</Text>
            <Text style={styles.mtdValue}>{money(r.mtd)}</Text>
            <Text style={styles.mtdMeta}>{r.mtdCount || 0} transactions</Text>
          </View>
          {r.mtdChangePct !== null && r.mtdChangePct !== undefined && (
            <View style={[
              styles.changeBadge,
              { backgroundColor: changePositive ? colors.success : colors.danger },
            ]}>
              <Ionicons
                name={changePositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={colors.bg}
              />
              <Text style={styles.changeText}>
                {changePositive ? '+' : ''}{r.mtdChangePct}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.footnote}>vs. same period last month</Text>

        {/* AR aging */}
        <Text style={styles.sectionHeader}>Accounts Receivable</Text>
        <View style={styles.arCard}>
          <View style={styles.arHeader}>
            <Text style={styles.arTotal}>{money(a.total, { decimals: 2 })}</Text>
            <Text style={styles.arTotalLabel}>Total outstanding</Text>
          </View>
          <View style={styles.arBuckets}>
            <ArBucket label="Current" sub="0-30d" value={a.current_0_30} color={colors.success} />
            <ArBucket label="31-60"   sub="days"  value={a.bucket_31_60}   color={colors.warning} />
            <ArBucket label="61-90"   sub="days"  value={a.bucket_61_90}   color={colors.danger} />
            <ArBucket label="90+"     sub="days"  value={a.bucket_90_plus} color={colors.danger} />
          </View>
        </View>

        {/* Revenue by category */}
        {cats.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>MTD by category</Text>
            <View style={styles.categoryCard}>
              {cats.map((c, i) => (
                <CategoryRow
                  key={c.category}
                  category={c.category}
                  total={c.total}
                  count={c.count}
                  isLast={i === cats.length - 1}
                  pct={cats[0].total > 0 ? (c.total / cats[0].total) * 100 : 0}
                />
              ))}
            </View>
          </>
        )}

        {/* Top outstanding balances */}
        {top.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Top outstanding balances</Text>
            <View style={styles.listCard}>
              {top.map((t, i) => (
                <View key={t.memberId} style={[styles.balanceRow, i !== top.length - 1 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.balanceName} numberOfLines={1}>{t.memberName}</Text>
                    <Text style={styles.balanceMeta}>{t.memberNumber}</Text>
                  </View>
                  <Text style={styles.balanceAmount}>{money(t.balance, { decimals: 2 })}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Recent activity */}
        {recent.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Recent activity</Text>
            <View style={styles.listCard}>
              {recent.slice(0, 15).map((tx, i) => (
                <View key={tx.id} style={[styles.txRow, i !== Math.min(recent.length, 15) - 1 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txDesc} numberOfLines={1}>
                      {tx.description || tx.category}
                    </Text>
                    <Text style={styles.txMeta} numberOfLines={1}>
                      {tx.memberName} · {tx.category} · {shortDate(tx.date)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.txAmount,
                    tx.amount < 0 && { color: colors.success },
                    tx.status === 'Overdue' && { color: colors.danger },
                  ]}>
                    {tx.amount < 0 ? '−' : ''}{money(Math.abs(tx.amount), { decimals: 2 })}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.hint}>
          Full GL, batch posting, and journal entries available on the web dashboard.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function RevCard({ label, value, count }) {
  return (
    <View style={styles.revCard}>
      <Text style={styles.revLabel}>{label}</Text>
      <Text style={styles.revValue}>{value}</Text>
      {count !== undefined && (
        <Text style={styles.revCount}>{count} tx</Text>
      )}
    </View>
  );
}

function ArBucket({ label, sub, value, color }) {
  const isEmpty = !value || Number(value) === 0;
  return (
    <View style={styles.arBucket}>
      <View style={[styles.arDot, { backgroundColor: isEmpty ? colors.textDim : color }]} />
      <Text style={styles.arBucketLabel}>{label}</Text>
      <Text style={styles.arBucketSub}>{sub}</Text>
      <Text style={[styles.arBucketValue, isEmpty && { color: colors.textDim }]}>
        {money(value, { decimals: 0 })}
      </Text>
    </View>
  );
}

function CategoryRow({ category, total, count, isLast, pct }) {
  return (
    <View style={[styles.catRow, !isLast && styles.rowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.catName}>{category}</Text>
        <View style={styles.catBarTrack}>
          <View style={[styles.catBarFill, { width: `${Math.max(pct, 3)}%` }]} />
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.catTotal}>{money(total, { decimals: 0 })}</Text>
        <Text style={styles.catCount}>{count} tx</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodyMuted, marginTop: spacing.xs, marginBottom: spacing.xl },

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

  gridRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  revCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  revLabel: { ...typography.label },
  revValue: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  revCount: { ...typography.caption, marginTop: 2 },

  mtdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xs,
  },
  mtdLabel: { ...typography.label, color: colors.bg, opacity: 0.8 },
  mtdValue: { fontSize: 32, fontWeight: '800', color: colors.bg, marginTop: spacing.xs },
  mtdMeta: { fontSize: 12, color: colors.bg, opacity: 0.7, marginTop: 2 },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  changeText: { color: colors.bg, fontWeight: '700', fontSize: 13 },
  footnote: { ...typography.caption, textAlign: 'right', marginTop: 4, marginBottom: spacing.xl },

  sectionHeader: {
    ...typography.label,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  arCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  arHeader: { marginBottom: spacing.lg },
  arTotal: { fontSize: 26, fontWeight: '700', color: colors.text },
  arTotalLabel: { ...typography.caption, marginTop: 2 },
  arBuckets: { flexDirection: 'row', gap: spacing.sm },
  arBucket: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  arDot: { width: 8, height: 8, borderRadius: 4, marginBottom: spacing.sm },
  arBucketLabel: { ...typography.body, fontSize: 13, fontWeight: '700' },
  arBucketSub: { ...typography.caption, fontSize: 10 },
  arBucketValue: { ...typography.body, fontSize: 14, fontWeight: '600', color: colors.accent, marginTop: spacing.sm },

  categoryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  catRow: {
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catName: { ...typography.body, fontWeight: '500' },
  catBarTrack: {
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  catBarFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  catTotal: { ...typography.body, fontWeight: '700', color: colors.accent },
  catCount: { ...typography.caption, marginTop: 2 },

  listCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  balanceRow: {
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceName: { ...typography.body, fontWeight: '600' },
  balanceMeta: { ...typography.caption, marginTop: 2 },
  balanceAmount: { ...typography.body, fontWeight: '700', color: colors.danger },

  txRow: {
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  txDesc: { ...typography.body, fontWeight: '500' },
  txMeta: { ...typography.caption, marginTop: 2 },
  txAmount: { ...typography.body, fontWeight: '700', color: colors.text },

  hint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
  },
});
