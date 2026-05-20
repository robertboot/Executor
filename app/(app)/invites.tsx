import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { acceptShareInvite, listMyPendingInvites } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { Inventory, InventoryShare } from '../../lib/types';

interface InviteRow extends InventoryShare {
  inventory_name?: string;
}

export default function Invites() {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const list = await listMyPendingInvites();
    const ids = list.map((s) => s.inventory_id);
    const inv: Record<string, Inventory> = {};
    if (ids.length > 0) {
      const { data } = await supabase
        .from('inventories')
        .select('id, name')
        .in('id', ids);
      for (const i of data ?? []) inv[i.id] = i as Inventory;
    }
    setInvites(list.map((s) => ({ ...s, inventory_name: inv[s.inventory_id]?.name })));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const accept = async (id: string) => {
    try {
      await acceptShareInvite(id);
      await load();
    } catch (e: any) {
      Alert.alert('Could not accept', e?.message ?? String(e));
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={invites}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16, gap: 8 }}
      ListEmptyComponent={<Text style={styles.empty}>No pending invites.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.inventory_name ?? 'An inventory'}</Text>
          <Text style={styles.meta}>Role: {item.role}</Text>
          <Pressable style={styles.button} onPress={() => accept(item.id)}>
            <Text style={styles.buttonText}>Accept</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  meta: { color: '#6b7280', marginTop: 4 },
  button: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: 'white', fontWeight: '600' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 24 },
});
