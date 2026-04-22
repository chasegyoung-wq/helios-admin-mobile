// Staff login screen. Uses the existing /api/auth/login endpoint.
// Rejects non-staff credentials.

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { colors, spacing, radius, typography } from '../lib/theme';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      Alert.alert('Sign in failed', err.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kb}
      >
        <View style={styles.brand}>
          <Image
            source={require('../assets/helios-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Admin</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@helios.app"
            placeholderTextColor={colors.textDim}
            editable={!busy}
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textDim}
            editable={!busy}
          />

          <TouchableOpacity
            style={[styles.button, busy && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={busy}
            activeOpacity={0.8}
          >
            {busy
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <Text style={styles.hint}>Staff credentials only. Members should use the Helios app.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  kb: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xxl * 1.5 },
  logo: {
    width: 180,
    height: 90,
  },
  tagline: {
    ...typography.label,
    marginTop: spacing.md,
    color: colors.accent,
    fontSize: 13,
    letterSpacing: 3,
  },
  form: {},
  label: { ...typography.label, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 16, letterSpacing: 1 },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
