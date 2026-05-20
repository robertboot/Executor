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
import { createCollection } from '../../../lib/api';
import { colors, radius, shadows } from '../../../lib/theme';

export default function NewCollection() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
      await createCollection(name.trim(), description.trim() || null);
      router.replace('/(app)/collections');
    } catch (e: any) {
      setError(e?.message ?? 'Could not create collection');
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
          <Text style={styles.title}>New Collection</Text>
          <Text style={styles.subtitle}>
            A collection groups items across all your inventories.
            Items inherit the collection name as their tag.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Mom's pearls, Workshop tools, Family Bibles"
            placeholderTextColor={colors.mutedSoft}
            autoFocus
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 90 }]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="What lives in this collection? Anything to remember about it."
            placeholderTextColor={colors.mutedSoft}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={submit}
          >
            <Text style={styles.buttonText}>
              {busy ? 'Creating…' : 'Create collection'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4, lineHeight: 20 },
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
  buttonText: { color: colors.onForest, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  error: { color: colors.danger, marginTop: 10 },
});
