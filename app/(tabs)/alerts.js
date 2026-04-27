// Alerts — cross-module notification inbox.
// Pulls from GET /api/alerts/recent. Marks read on tap.

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator,
  TouchableOpacity, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost } from '../../lib/api';
import { colors, spacing, radius, typography } from '../../lib/theme';

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'unread',   label: 'Unread' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning',  label: 'Warning' },
];

const SEVERITY_META = {
  critical: { color: colors.danger,  icon: 'alert-circle',          label: 'Critical' },
  warning:  { color: colors.warning, icon: 'warning',               label: 'Warning'  },
  info:     { color: colors.info,    icon: 'information-circle',    label: 'Info'     },
};

const TYPE_META = {
  feedback_low:      { icon: 'chatbubble-ellipses-outline', label: 'Feedback' },
  billing_overdue:   { icon: 'card-outline',                label: 'Billing'  },
  guest_card_new:    { icon: 'person-add-outline',          label: 'Guest'    },
  work_order_new:    { icon: 'construct-outline',           label: 'Maint.'   },
  hoa_violation:     { icon: 'home-outline',                label: 'HOA'      },
  marina_compliance: { icon: 'boat-outline',                label: 'Marina'   },
  membership_app:    { icon: 'document-text-outline',       label: 'Apps'     },
  architectural_req: { icon: 'business-outline',            label: 'Arch.'    },
  beo_pending:       { icon: 'restaurant-outline',          label: 'Catering' },
  dock_cart_new:     { icon: 'qr-code-outline',             label: 'Dock'     },
  system:            { icon: 'pulse-outline',               label: 'System'   },
};

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Alerts() {
  const [data, setData] = useState({ alerts: [], counts: { unread: 0, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiGet(`/alerts/recent?filter=${filter}&limit=100`);
      setData(res || { alerts: [], counts: {} });
    } catch (err) {
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  async function markRead(alertId) {
    // Optimistic local update
    setData((d) => ({
      ...d,
      alerts: d.alerts.map((a) => a.id === alertId ? { ...a, isRead: true } : a),
      counts: { ...d.counts, unread: Math.max(0, (d.counts.unread || 0) - 1) },
    }));
    try {
      await apiPost(`/alerts/${alertId}/read`, {});
    } catch {
      // Best-effort; reload on next pull
    }
  }

  async function markAllRead() {
    if ((data.counts?.unread || 0) === 0) return;
    Alert.alert(
      'Mark all read?',
      `This will mark ${data.counts.unread} alert${data.counts.unread === 1 ? '' : 's'} as read.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark all read',
          onPress: async () => {
            try {
              await apiPost('/alerts/read-all', {});
              load();
            } catch (err) {
              Alert.alert('Failed', err.message || 'Could not mark all read');
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  const counts = data.counts || {};
  const isEmpty = (data.alerts || []).length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={data.alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Alerts</Text>
                <Text style={styles.subtitle}>
                  {counts.unread || 0} unread · {counts.total || 0} total
                </Text>
              </View>
              {(counts.unread || 0) > 0 && (
                <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn} activeOpacity={0.7}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Severity summary chips */}
            {(counts.unreadCritical > 0 || counts.unreadWarning > 0) && (
              <View style={styles.summaryRow}>
                {counts.unreadCritical > 0 && (
                  <View style={[styles.summaryChip, { borderColor: colors.danger }]}>
                    <Ionicons name="alert-circle" size={14} color={colors.danger} />
                    <Text style={[styles.summaryText, { color: colors.danger }]}>
                      {counts.unreadCritical} critical
                    </Text>
                  </View>
                )}
                {counts.unreadWarning > 0 && (
                  <View style={[styles.summaryChip, { borderColor: colors.warning }]}>
                    <Ionicons name="warning" size={14} color={colors.warning} />
                    <Text style={[styles.summaryText, { color: colors.warning }]}>
                      {counts.unreadWarning} warning
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Filter pills */}
            <View style={styles.filterRow}>
              {FILTERS.map((f) => {
                const active = filter === f.key;
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <AlertCard alert={item} onPress={() => !item.isRead && markRead(item.id)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          isEmpty && (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptyText}>
                {filter === 'unread'
                  ? 'No unread alerts. Pull down to refresh.'
                  : filter === 'critical' || filter === 'warning'
                    ? `No ${filter} alerts right now.`
                    : 'No alerts to show.'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function AlertCard({ alert, onPress }) {
  const sev = SEVERITY_META[alert.severity] || SEVERITY_META.info;
  const tm  = TYPE_META[alert.type] || { icon: 'pulse-outline', label: alert.type };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        { borderLeftColor: sev.color, borderLeftWidth: 4 },
        !alert.isRead && styles.cardUnread,
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.sevIcon, { backgroundColor: sev.color + '22' }]}>
          <Ionicons name={sev.icon} size={18} color={sev.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{alert.title}</Text>
            {!alert.isRead && <View style={styles.unreadDot} />}
          </View>
          <View style={styles.cardMetaRow}>
            <View style={styles.typePill}>
              <Ionicons name={tm.icon} size={11} color={colors.textMuted} />
              <Text style={styles.typeText}>{tm.label}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(alert.createdAt)}</Text>
          </View>
        </View>
      </View>
      {alert.body ? (
        <Text style={styles.cardBody} numberOfLines={3}>{alert.body}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },

  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodyMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  markAllBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  markAllText: { color: colors.accent, fontWeight: '600', fontSize: 13 },

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

  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  summaryText: { fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },

  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  filterChip: {
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

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  cardUnread: { backgroundColor: colors.surface2 },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  sevIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.body, fontWeight: '700', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
  },
  typeText: { ...typography.caption, fontSize: 11, fontWeight: '600' },
  timeText: { ...typography.caption },
  cardBody: {
    ...typography.bodyMuted,
    fontSize: 14,
    marginTop: spacing.md,
    marginLeft: 32 + spacing.md,
    lineHeight: 20,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 1.5,
    gap: spacing.md,
  },
  emptyTitle: { ...typography.h2, color: colors.success },
  emptyText: { ...typography.bodyMuted, textAlign: 'center', paddingHorizontal: spacing.xl },
});
