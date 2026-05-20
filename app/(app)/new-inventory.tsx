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
} from 'react-native';
import { createInventory } from '../../lib/api';

export default function NewInventory() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const inv = await createInventory(name.trim(), description.trim() || null);
      router.replace(`/(app)/inventory/${inv.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Books, Antiques, Workshop"
        />
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="What goes in this inventory?"
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable
          style={[styles.button, busy && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={busy}
        >
          <Text style={styles.buttonText}>{busy ? 'Creating…' : 'Create inventory'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 6 },
  label: { fontWeight: '500', color: '#374151', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: 'white', fontWeight: '600' },
  error: { color: '#b91c1c', marginTop: 12 },
});
