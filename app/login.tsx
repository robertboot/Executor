import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Disclaimer from '../components/Disclaimer';
import Logo from '../components/Logo';
import { useAuth } from '../lib/auth';
import { colors, radius, shadows } from '../lib/theme';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(app)');
    } catch (e: any) {
      setError(e?.message ?? 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.crest}>
          <Logo />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your Heirloom inventory.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedSoft}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.mutedSoft}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, busy && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={busy}
          >
            <Text style={styles.buttonText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>

          <Link href="/signup" style={styles.link}>
            <Text style={styles.linkText}>No account yet? Create one</Text>
          </Link>
        </View>

        <Disclaimer />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 32, gap: 16 },
  crest: { alignItems: 'center', marginVertical: 16 },
  card: {
    backgroundColor: colors.paper,
    padding: 20,
    borderRadius: radius.lg,
    borderColor: colors.hairline,
    borderWidth: 1,
    gap: 6,
    ...shadows.card,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { color: colors.muted, marginBottom: 8 },
  label: { color: colors.inkSoft, fontWeight: '500', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.cream,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.forest,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: colors.onForest, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { color: colors.gold, fontWeight: '600' },
  error: { color: colors.danger, marginTop: 12 },
});
