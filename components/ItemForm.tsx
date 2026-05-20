import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { listMyCollectionNames } from '../lib/api';
import { CATEGORY_PRESETS, findCategory } from '../lib/categories';
import type { Item } from '../lib/types';

export type ItemFormValues = {
  name: string;
  category: string | null;
  description: string;
  condition: string;
  location: string;
  value_amount: string;
  value_currency: string;
  notes: string;
  provenance: string;
  acquired_date: string;
  intended_recipient_name: string;
  intended_recipient_contact: string;
  bequest_notes: string;
  custom_fields: Record<string, string>;
};

export function itemToFormValues(it: Partial<Item>): ItemFormValues {
  return {
    name: it.name ?? '',
    category: it.category ?? null,
    description: it.description ?? '',
    condition: it.condition ?? '',
    location: it.location ?? '',
    value_amount: it.value_amount != null ? String(it.value_amount) : '',
    value_currency: it.value_currency ?? 'USD',
    notes: it.notes ?? '',
    provenance: it.provenance ?? '',
    acquired_date: it.acquired_date ?? '',
    intended_recipient_name: it.intended_recipient_name ?? '',
    intended_recipient_contact: it.intended_recipient_contact ?? '',
    bequest_notes: it.bequest_notes ?? '',
    custom_fields: Object.fromEntries(
      Object.entries((it.custom_fields ?? {}) as Record<string, unknown>).map(([k, v]) => [
        k,
        v == null ? '' : String(v),
      ]),
    ),
  };
}

export function formValuesToDraft(v: ItemFormValues) {
  const cleanCustom: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v.custom_fields)) {
    if (val !== '' && val != null) cleanCustom[k] = val;
  }
  return {
    name: v.name.trim(),
    category: v.category,
    description: v.description.trim() || null,
    condition: v.condition.trim() || null,
    location: v.location.trim() || null,
    value_amount: v.value_amount.trim() ? Number(v.value_amount) : null,
    value_currency: v.value_currency.trim() || 'USD',
    notes: v.notes.trim() || null,
    provenance: v.provenance.trim() || null,
    acquired_date: v.acquired_date.trim() || null,
    intended_recipient_name: v.intended_recipient_name.trim() || null,
    intended_recipient_contact: v.intended_recipient_contact.trim() || null,
    bequest_notes: v.bequest_notes.trim() || null,
    custom_fields: cleanCustom,
  };
}

interface Props {
  initial: ItemFormValues;
  onSubmit: (values: ItemFormValues) => Promise<void> | void;
  submitLabel: string;
}

export default function ItemForm({ initial, onSubmit, submitLabel }: Props) {
  const [v, setV] = useState<ItemFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customChips, setCustomChips] = useState<string[]>([]);

  useEffect(() => {
    listMyCollectionNames().then((names) => {
      const presetKeys = new Set(CATEGORY_PRESETS.map((p) => p.key.toLowerCase()));
      const presetLabels = new Set(CATEGORY_PRESETS.map((p) => p.label.toLowerCase()));
      setCustomChips(
        names.filter(
          (n) =>
            !presetKeys.has(n.toLowerCase()) && !presetLabels.has(n.toLowerCase()),
        ),
      );
    }).catch(() => {});
  }, []);

  const cat = findCategory(v.category);

  const update = <K extends keyof ItemFormValues>(k: K, val: ItemFormValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const submit = async () => {
    setError(null);
    if (!v.name.trim()) {
      setError('Name is required');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(v);
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.section}>Basics</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput style={styles.input} value={v.name} onChangeText={(t) => update('name', t)} />

      <Text style={styles.label}>Collection</Text>
      <Text style={styles.help}>Pick a preset or type your own. You can skip this and add later.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CATEGORY_PRESETS.map((c) => (
            <Pressable
              key={c.key}
              style={[styles.chip, v.category === c.key && styles.chipActive]}
              onPress={() => update('category', v.category === c.key ? null : c.key)}
            >
              <Text style={v.category === c.key ? styles.chipTextActive : styles.chipText}>
                {c.label}
              </Text>
            </Pressable>
          ))}
          {customChips.map((name) => (
            <Pressable
              key={`custom-${name}`}
              style={[styles.chip, v.category === name && styles.chipActive]}
              onPress={() => update('category', v.category === name ? null : name)}
            >
              <Text style={v.category === name ? styles.chipTextActive : styles.chipText}>
                {name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <TextInput
        style={styles.input}
        value={
          v.category && !CATEGORY_PRESETS.some((c) => c.key === v.category)
            ? v.category
            : ''
        }
        onChangeText={(t) => update('category', t || null)}
        placeholder="Or type a custom collection (e.g. Grandfather's tools)"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { minHeight: 70 }]}
        value={v.description}
        onChangeText={(t) => update('description', t)}
        multiline
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Condition</Text>
          <TextInput
            style={styles.input}
            value={v.condition}
            onChangeText={(t) => update('condition', t)}
            placeholder="e.g. Excellent"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={v.location}
            onChangeText={(t) => update('location', t)}
            placeholder="e.g. Living room"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <Text style={styles.label}>Value</Text>
          <TextInput
            style={styles.input}
            value={v.value_amount}
            onChangeText={(t) => update('value_amount', t)}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Currency</Text>
          <TextInput
            style={styles.input}
            value={v.value_currency}
            onChangeText={(t) => update('value_currency', t.toUpperCase())}
            placeholder="USD"
            maxLength={3}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <Text style={styles.label}>Acquired date</Text>
      <TextInput
        style={styles.input}
        value={v.acquired_date}
        onChangeText={(t) => update('acquired_date', t)}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.label}>Provenance / history</Text>
      <TextInput
        style={[styles.input, { minHeight: 70 }]}
        value={v.provenance}
        onChangeText={(t) => update('provenance', t)}
        multiline
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, { minHeight: 70 }]}
        value={v.notes}
        onChangeText={(t) => update('notes', t)}
        multiline
      />

      {cat && cat.fields.length > 0 && (
        <>
          <Text style={styles.section}>{cat.label} details</Text>
          {cat.fields.map((f) => (
            <View key={f.key}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={v.custom_fields[f.key] ?? ''}
                onChangeText={(t) =>
                  update('custom_fields', { ...v.custom_fields, [f.key]: t })
                }
                keyboardType={f.type === 'number' ? 'numeric' : 'default'}
              />
            </View>
          ))}
        </>
      )}

      <Text style={styles.section}>Intended recipient</Text>
      <Text style={styles.help}>
        Your wishes for who should inherit this item. This is informational only — not a legal
        will.
      </Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={v.intended_recipient_name}
        onChangeText={(t) => update('intended_recipient_name', t)}
      />
      <Text style={styles.label}>How to reach them</Text>
      <TextInput
        style={styles.input}
        value={v.intended_recipient_contact}
        onChangeText={(t) => update('intended_recipient_contact', t)}
        placeholder="Email, phone, or relationship"
      />
      <Text style={styles.label}>Bequest notes</Text>
      <TextInput
        style={[styles.input, { minHeight: 90 }]}
        value={v.bequest_notes}
        onChangeText={(t) => update('bequest_notes', t)}
        multiline
        placeholder="Why this person, special instructions, etc."
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.submit, busy && { opacity: 0.6 }]}
        disabled={busy}
        onPress={submit}
      >
        <Text style={styles.submitText}>{busy ? 'Saving…' : submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 4, paddingBottom: 60 },
  section: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#6b7280',
    marginTop: 18,
    marginBottom: 4,
  },
  label: { color: '#374151', marginTop: 10, fontWeight: '500' },
  help: { color: '#6b7280', fontSize: 13, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'white',
    marginTop: 6,
  },
  row: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
  },
  chipActive: { backgroundColor: '#111827' },
  chipText: { color: '#374151' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  submit: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: { color: 'white', fontWeight: '600' },
  error: { color: '#b91c1c', marginTop: 12 },
});
