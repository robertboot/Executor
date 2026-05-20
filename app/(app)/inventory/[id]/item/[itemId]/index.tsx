import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PhotoStrip from '../../../../../../components/PhotoStrip';
import { deleteItem, getInventoryRole, getItem } from '../../../../../../lib/api';
import { findCategory } from '../../../../../../lib/categories';
import { formatDate, formatMoney } from '../../../../../../lib/format';
import type { Item, Role } from '../../../../../../lib/types';

export default function ItemDetail() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [role, setRole] = useState<'owner' | Role | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!itemId || !id) return;
    const [it, r] = await Promise.all([getItem(itemId), getInventoryRole(id)]);
    setItem(it);
    setRole(r);
    setLoading(false);
  }, [itemId, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Item not found.</Text>
      </View>
    );
  }

  const canEdit = role === 'owner' || role === 'contributor';
  const canDelete = role === 'owner';
  const cat = findCategory(item.category);
  const customEntries = Object.entries(item.custom_fields ?? {});

  const onDelete = () => {
    Alert.alert('Delete item?', 'This will also remove its photos and history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(item.id);
            router.replace(`/(app)/inventory/${id}`);
          } catch (e: any) {
            Alert.alert('Delete failed', e?.message ?? String(e));
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
      <PhotoStrip inventoryId={id!} itemId={itemId!} canEdit={canEdit} />

      <View style={styles.body}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.metaLine}>
          {cat?.label ?? item.category ?? 'Uncategorized'} •{' '}
          {formatMoney(item.value_amount, item.value_currency)}
        </Text>

        {item.description ? (
          <Section title="Description">
            <Text style={styles.body1}>{item.description}</Text>
          </Section>
        ) : null}

        <Section title="Details">
          <Row label="Condition" value={item.condition} />
          <Row label="Location" value={item.location} />
          <Row label="Acquired" value={formatDate(item.acquired_date)} />
        </Section>

        {cat && cat.fields.length > 0 && customEntries.length > 0 && (
          <Section title={`${cat.label} details`}>
            {cat.fields.map((f) => (
              <Row
                key={f.key}
                label={f.label}
                value={(item.custom_fields as Record<string, unknown>)[f.key] as string | undefined}
              />
            ))}
          </Section>
        )}

        {item.provenance ? (
          <Section title="Provenance">
            <Text style={styles.body1}>{item.provenance}</Text>
          </Section>
        ) : null}

        {item.notes ? (
          <Section title="Notes">
            <Text style={styles.body1}>{item.notes}</Text>
          </Section>
        ) : null}

        <Section title="Intended recipient">
          <Row label="Name" value={item.intended_recipient_name} />
          <Row label="Contact" value={item.intended_recipient_contact} />
          {item.bequest_notes ? (
            <>
              <Text style={styles.rowLabel}>Bequest notes</Text>
              <Text style={styles.body1}>{item.bequest_notes}</Text>
            </>
          ) : null}
        </Section>

        <View style={{ marginTop: 24, gap: 8 }}>
          <Link href={`/(app)/inventory/${id}/item/${itemId}/qr`} asChild>
            <Pressable style={styles.primary}>
              <Text style={styles.primaryText}>Show QR code</Text>
            </Pressable>
          </Link>
          <Link href={`/(app)/inventory/${id}/item/${itemId}/history`} asChild>
            <Pressable style={styles.secondary}>
              <Text style={styles.secondaryText}>History</Text>
            </Pressable>
          </Link>
          {canEdit && (
            <Link href={`/(app)/inventory/${id}/item/${itemId}/edit`} asChild>
              <Pressable style={styles.secondary}>
                <Text style={styles.secondaryText}>Edit</Text>
              </Pressable>
            </Link>
          )}
          {canDelete && (
            <Pressable style={styles.destructive} onPress={onDelete}>
              <Text style={styles.destructiveText}>Delete item</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 6 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  metaLine: { color: '#6b7280', marginBottom: 8 },
  body1: { color: '#111827', lineHeight: 20 },
  section: {
    marginTop: 18,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', marginBottom: 6 },
  rowLabel: { color: '#6b7280', width: 120, fontWeight: '500' },
  rowValue: { color: '#111827', flex: 1 },
  primary: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryText: { color: 'white', fontWeight: '600' },
  secondary: {
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryText: { color: '#111827', fontWeight: '500' },
  destructive: {
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  destructiveText: { color: '#b91c1c', fontWeight: '600' },
});
