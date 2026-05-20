import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getInventoryRole, listRevisions, restoreRevision } from '../../../../../../lib/api';
import { confirm, notify } from '../../../../../../lib/confirm';
import { formatDateTime, formatMoney } from '../../../../../../lib/format';
import type { ItemRevision, Role } from '../../../../../../lib/types';

export default function ItemHistory() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const [revs, setRevs] = useState<ItemRevision[]>([]);
  const [role, setRole] = useState<'owner' | Role | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!itemId || !id) return;
    const [r, ro] = await Promise.all([listRevisions(itemId), getInventoryRole(id)]);
    setRevs(r);
    setRole(ro);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [itemId, id]);

  const canRestore = role === 'owner' || role === 'contributor';

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const onRestore = async (rev: ItemRevision) => {
    const ok = await confirm(
      'Restore this version?',
      'The current item fields will be replaced with this snapshot. A new revision will be created.',
    );
    if (!ok) return;
    try {
      await restoreRevision(rev.id);
      router.replace(`/(app)/inventory/${id}/item/${itemId}`);
    } catch (e: any) {
      notify('Restore failed', e?.message ?? String(e));
    }
  };

  return (
    <FlatList
      data={revs}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      ListEmptyComponent={<Text style={styles.empty}>No revisions yet.</Text>}
      renderItem={({ item: rev, index }) => {
        const snap = rev.snapshot;
        return (
          <View style={styles.card}>
            <Text style={styles.when}>{formatDateTime(rev.changed_at)}</Text>
            <Text style={styles.tag}>{index === 0 ? 'Current' : `Version ${revs.length - index}`}</Text>
            <Text style={styles.name}>{snap.name}</Text>
            <Text style={styles.line}>{snap.description ?? '—'}</Text>
            <Text style={styles.meta}>
              Value: {formatMoney(snap.value_amount, snap.value_currency)}
            </Text>
            {snap.intended_recipient_name ? (
              <Text style={styles.meta}>Recipient: {snap.intended_recipient_name}</Text>
            ) : null}
            {snap.bequest_notes ? (
              <Text style={styles.bequest}>Bequest: {snap.bequest_notes}</Text>
            ) : null}
            {canRestore && index !== 0 && (
              <Pressable style={styles.restore} onPress={() => onRestore(rev)}>
                <Text style={styles.restoreText}>Restore this version</Text>
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 4,
  },
  when: { color: '#6b7280', fontSize: 12 },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    color: '#374151',
  },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  line: { color: '#374151' },
  meta: { color: '#6b7280', fontSize: 13 },
  bequest: { color: '#374151', fontStyle: 'italic', marginTop: 4 },
  restore: {
    marginTop: 8,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  restoreText: { color: '#111827', fontWeight: '500' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 24 },
});
