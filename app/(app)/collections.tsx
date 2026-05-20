import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { CATEGORY_PRESETS, labelForCategory } from '../../lib/categories';
import { formatMoney } from '../../lib/format';

interface CollectionRow {
  key: string;
  label: string;
  count: number;
  totalValue: number;
  currency: string;
}

export default function Collections() {
  const router = useRouter();
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('items')
      .select('category, value_amount, value_currency');
    if (error) {
      setLoading(false);
      return;
    }
    const map = new Map<string, CollectionRow>();
    for (const it of data ?? []) {
      const key = (it.category as string) ?? '__uncategorized';
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: key === '__uncategorized' ? 'Uncategorized' : labelForCategory(key),
          count: 0,
          totalValue: 0,
          currency: 'USD',
        });
      }
      const r = map.get(key)!;
      r.count += 1;
      if (it.value_amount != null) r.totalValue += Number(it.value_amount);
      if (it.value_currency) r.currency = it.value_currency as string;
    }
    setRows([...map.values()].sort((a, b) => b.count - a.count));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.key}
      contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 80 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.headerTitle}>Your collections</Text>
          <Text style={styles.headerHelp}>
            Items grouped by their collection tag across every inventory you own
            or share.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>
            Add items to an inventory and pick a collection (or type your own)
            and they'll appear here.
          </Text>
          <Text style={styles.subhead}>Starter collections</Text>
          <View style={styles.chipRow}>
            {CATEGORY_PRESETS.map((c) => (
              <View key={c.key} style={styles.chip}>
                <Text style={styles.chipText}>{c.label}</Text>
              </View>
            ))}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() =>
            router.push({
              pathname: '/(app)/collections/[key]',
              params: { key: item.key },
            })
          }
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{item.label}</Text>
            <Text style={styles.rowMeta}>
              {item.count} item{item.count === 1 ? '' : 's'}
              {item.totalValue > 0
                ? ` • ${formatMoney(item.totalValue, item.currency)}`
                : ''}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerHelp: { color: '#6b7280', marginTop: 4 },
  row: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  rowMeta: { color: '#6b7280', marginTop: 2 },
  chevron: { fontSize: 24, color: '#9ca3af', marginLeft: 8 },
  empty: { marginTop: 16, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  subhead: { marginTop: 24, color: '#374151', fontWeight: '500' },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: '#374151' },
});
