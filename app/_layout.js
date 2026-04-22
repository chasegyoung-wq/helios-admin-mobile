// Root layout — wraps the entire app in AuthProvider and sets the theme.
// Also handles the "am I logged in?" redirect logic.

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors } from '../lib/theme';

function RootNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inTabs = segments[0] === '(tabs)';
    if (!user && inTabs) {
      router.replace('/login');
    } else if (user && !inTabs && segments[0] !== 'login' || (user && segments[0] === 'login')) {
      // Logged in — push into tabs if they're on login
      if (segments[0] === 'login' || segments.length === 0) {
        router.replace('/(tabs)/dashboard');
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '600' },
      contentStyle: { backgroundColor: colors.bg },
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <RootNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
