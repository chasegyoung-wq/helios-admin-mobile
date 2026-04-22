// Entry point — redirects based on auth state.
// The actual redirect logic lives in _layout.js via useEffect.

import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../lib/theme';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)/dashboard" />;
  return <Redirect href="/login" />;
}
