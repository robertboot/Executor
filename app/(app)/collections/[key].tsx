import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { labelForCategory } from '../../../lib/categories';
import { formatMoney } from '../../../lib/format';
import { supabase } from '../../../lib/supabase';
import type { Inventory, Item } from '../../../lib/types';

interface Row {
  item: Item;
  inventory_name: string | null;
}

export default function CollectionDetail() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!key) return;
    (async () => {
      const isUncat = key === '__uncategorized';
      let q = supabase
        .from('items')
        .select('*, inventory:inventories(id, name)')
        .order('name');
      q = isUncat ? q.is('category', null) : q.eq('category', key);
      const { data, error } = await q;
      if (error) {
        setLoading(false);
        return;
      }
      const flat: Row[] = (data ?? []).map((r: Item & { inventory: Inventory | Inventory[] | null }) => ({
        item: r,
        inventory_name: Array.isArray(r.inventory)
          ? r.inventory[0]?.name ?? null
          : r.inventory?.name ?? null,
      }));
      setRows(flat);
      setLoading(false);
    })();
  }, [key]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const heading =
    key === '__uncategorized' ? 'Uncategorized' : labelForCategory(key);

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.item.id}
      contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 80 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.title}>{heading}</Text>
          <Text style={styles.meta}>
            {rows.length} item{rows.length === 1 ? '' : 's'} across your inventories
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          No items in this collection yet.
        </Text>
      }
      renderItem={({ item: r }) => (
        <Link
          href={`/(app)/inventory/${r.item.inventory_id}/item/${r.item.id}`}
          asChild
        >
          <Pressable style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{r.item.name}</Text>
              <Text style={styles.itemMeta}>
                {r.inventory_name ?? 'Inventory'}
                {r.item.intended_recipient_name
                  ? ` • for ${r.item.intended_recipient_name}`
                  : ''}
              </Text>
            </View>
            <Text style={styles.value}>
              {formatMoney(r.item.value_amount, r.item.value_currency)}
            </Text>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  meta: { color: '#6b7280', marginTop: 4 },
  row: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemName: { fontSize: 16, fontWeight: '500', color: '#111827' },
  itemMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  value: { fontWeight: '600', color: '#111827' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 24 },
});
