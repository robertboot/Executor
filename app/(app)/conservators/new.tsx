import { router } from 'expo-router';
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
import { createConservator } from '../../../lib/api';
import { colors, radius, shadows } from '../../../lib/theme';

export default function NewConservator() {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createConservator({ name, relationship, email, phone, notes });
      router.replace('/(app)/conservators');
    } catch (e: any) {
      setError(e?.message ?? 'Could not save');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>New Conservator</Text>
          <Text style={styles.subtitle}>
            A trusted person who can look after specific items.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Sara Williams"
            placeholderTextColor={colors.mutedSoft}
          />
          <Text style={styles.label}>Relationship</Text>
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="Daughter • Restorer • Insurer"
            placeholderTextColor={colors.mutedSoft}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.mutedSoft}
          />
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={colors.mutedSoft}
          />
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="What they look after, when to contact, anything important."
            placeholderTextColor={colors.mutedSoft}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={submit}
          >
            <Text style={styles.buttonText}>{busy ? 'Saving…' : 'Save conservator'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4 },
  card: {
    backgroundColor: colors.paper,
    padding: 18,
    borderRadius: radius.lg,
    borderColor: colors.hairline,
    borderWidth: 1,
    gap: 4,
    ...shadows.card,
  },
  label: { color: colors.inkSoft, fontWeight: '600', marginTop: 10, marginBottom: 6 },
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
    marginTop: 18,
  },
  buttonText: { color: colors.onForest, fontWeight: '700', fontSize: 16 },
  error: { color: colors.danger, marginTop: 10 },
});
