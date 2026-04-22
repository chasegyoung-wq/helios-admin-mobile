// Feedback triage — consumes /api/feedback/summary.
// Read-only v1. Workflow (assign/resolve) will come with a schema migration.

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator,
  TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../../lib/api';
import { colors, spacing, radius, typography } from '../../lib/theme';

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'low',       label: 'Needs attention' },
  { key: 'comments',  label: 'With comments' },
];

function timeAgo(isoString) {
  if (!isoString) return '';
  const then = new Date(isoString).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

function ratingColor(rating) {
  if (rating <= 2) return colors.danger;
  if (rating === 3) return colors.warning;
  return colors.success;
}

function Stars({ rating, size = 14 }) {
  const color = ratingColor(rating);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color={i <= rating ? color : colors.textDim}
        />
      ))}
    </View>
  );
}

export default function Feedback() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiGet('/feedback/summary?days=30');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const filtered = useMemo(() => {
    if (!data?.comments) return [];
    if (filter === 'low') return data.comments.filter((c) => c.rating <= 2);
    if (filter === 'comments') return data.comments.filter((c) => c.comment && c.comment.trim());
    return data.comments;
  }, [data, filter]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  const overall = data?.overall || {};
  const lowCount = (data?.comments || []).filter((c) => c.rating <= 2).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Feedback</Text>
            <Text style={styles.subtitle}>Member sentiment · last 30 days</Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Summary row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {overall.avg_rating ?? '—'}
                </Text>
                <Text style={styles.statLabel}>Avg rating</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{overall.total_responses ?? '—'}</Text>
                <Text style={styles.statLabel}>Responses</Text>
              </View>
              <View style={[styles.statBox, styles.statBoxDanger]}>
                <Text style={[styles.statValue, { color: colors.danger }]}>
                  {overall.negative ?? 0}
                </Text>
                <Text style={styles.statLabel}>Low (≤2)</Text>
              </View>
            </View>

            {/* Bonus eligibility, if any */}
            {Array.isArray(data?.bonusStatus) && data.bonusStatus.length > 0 && (
              <View style={styles.bonusCard}>
                <Text style={styles.bonusTitle}>Staff bonus eligibility (MTD)</Text>
                {data.bonusStatus.map((b) => (
                  <View key={b.category} style={styles.bonusRow}>
                    <Text style={styles.bonusCategory}>{b.category}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text style={styles.bonusRating}>{b.avg_rating ?? '—'}</Text>
                      <View style={[
                        styles.bonusPill,
                        { backgroundColor: b.bonus_eligible ? colors.success : colors.textDim },
                      ]}>
                        <Text style={styles.bonusPillText}>
                          {b.bonus_eligible ? 'Eligible' : 'Below'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Filter pills */}
            <View style={styles.filterRow}>
              {FILTERS.map((f) => {
                const active = filter === f.key;
                const showBadge = f.key === 'low' && lowCount > 0;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {f.label}
                    </Text>
                    {showBadge && (
                      <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>{lowCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.listLabel}>
              {filtered.length} {filtered.length === 1 ? 'comment' : 'comments'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <FeedbackCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
            <Text style={styles.emptyText}>
              {filter === 'low'
                ? 'No low ratings in the last 30 days. Clean sweep!'
                : 'No feedback to show.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function FeedbackCard({ item }) {
  const isLow = item.rating <= 2;
  const memberName = item.is_anonymous
    ? 'Anonymous'
    : (item.first_name || item.last_name)
      ? `${item.first_name || ''} ${item.last_name || ''}`.trim()
      : 'Unknown member';

  return (
    <View style={[styles.card, isLow && styles.cardLow]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardMember} numberOfLines={1}>
            {memberName}
            {item.member_number ? (
              <Text style={styles.cardMemberNum}> · {item.member_number}</Text>
            ) : null}
          </Text>
          <View style={styles.cardMeta}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(item.submitted_at)}</Text>
          </View>
        </View>
        <Stars rating={item.rating} />
      </View>
      {item.comment ? (
        <Text style={styles.cardComment}>{item.comment}</Text>
      ) : null}
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

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statBoxDanger: { borderColor: colors.danger },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  statLabel: { ...typography.caption, marginTop: 2 },

  bonusCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bonusTitle: { ...typography.label, marginBottom: spacing.md },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bonusCategory: { ...typography.body, fontWeight: '500' },
  bonusRating: { ...typography.body, color: colors.accent, fontWeight: '600' },
  bonusPill: { paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: radius.pill },
  bonusPillText: { color: colors.bg, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { ...typography.body, fontSize: 13, color: colors.textMuted },
  filterTextActive: { color: colors.bg, fontWeight: '700' },
  filterBadge: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  listLabel: { ...typography.caption, marginBottom: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardLow: { borderColor: colors.danger, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardMember: { ...typography.body, fontWeight: '600' },
  cardMemberNum: { ...typography.caption, fontWeight: '400' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  categoryPill: {
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  categoryText: { ...typography.caption, color: colors.text, fontSize: 11 },
  timeText: { ...typography.caption },
  cardComment: {
    ...typography.body,
    marginTop: spacing.md,
    lineHeight: 21,
    color: colors.text,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: { ...typography.bodyMuted, textAlign: 'center' },
});
