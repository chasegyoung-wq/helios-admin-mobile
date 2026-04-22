import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { visibleTabsForUser } from '../../lib/roles';
import { colors } from '../../lib/theme';

const ICONS = {
  dashboard: 'grid-outline',
  today:     'today-outline',
  feedback:  'chatbubbles-outline',
  billing:   'card-outline',
  orders:    'receipt-outline',
  alerts:    'notifications-outline',
  more:      'ellipsis-horizontal-circle-outline',
};

const LABELS = {
  dashboard: 'Dashboard',
  today:     'Today',
  feedback:  'Feedback',
  billing:   'Billing',
  orders:    'Orders',
  alerts:    'Alerts',
  more:      'More',
};

function TabIcon({ name, color, size }) {
  return <Ionicons name={ICONS[name] || 'ellipse-outline'} size={size || 22} color={color} />;
}

export default function TabsLayout() {
  const { user } = useAuth();
  const visible = visibleTabsForUser(user);

  return (
    <Tabs screenOptions={{
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: 88,
        paddingTop: 8,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '700' },
    }}>
      <Tabs.Screen name="dashboard" options={{
        title: LABELS.dashboard,
        href: visible.includes('dashboard') ? '/(tabs)/dashboard' : null,
        tabBarIcon: ({ color, size }) => <TabIcon name="dashboard" color={color} size={size} />,
      }} />
      <Tabs.Screen name="today" options={{
        title: LABELS.today,
        href: visible.includes('today') ? '/(tabs)/today' : null,
        tabBarIcon: ({ color, size }) => <TabIcon name="today" color={color} size={size} />,
      }} />
      <Tabs.Screen name="feedback" options={{
        title: LABELS.feedback,
        href: visible.includes('feedback') ? '/(tabs)/feedback' : null,
        tabBarIcon: ({ color, size }) => <TabIcon name="feedback" color={color} size={size} />,
      }} />
      <Tabs.Screen name="billing" options={{
        title: LABELS.billing,
        href: visible.includes('billing') ? '/(tabs)/billing' : null,
        tabBarIcon: ({ color, size }) => <TabIcon name="billing" color={color} size={size} />,
      }} />
      <Tabs.Screen name="orders" options={{
        title: LABELS.orders,
        href: visible.includes('orders') ? '/(tabs)/orders' : null,
        tabBarIcon: ({ color, size }) => <TabIcon name="orders" color={color} size={size} />,
      }} />
      <Tabs.Screen name="alerts" options={{
        title: LABELS.alerts,
        href: visible.includes('alerts') ? '/(tabs)/alerts' : null,
        tabBarIcon: ({ color, size }) => <TabIcon name="alerts" color={color} size={size} />,
      }} />
      <Tabs.Screen name="more" options={{
        title: LABELS.more,
        tabBarIcon: ({ color, size }) => <TabIcon name="more" color={color} size={size} />,
      }} />
    </Tabs>
  );
}
