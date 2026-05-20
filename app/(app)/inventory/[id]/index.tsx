import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getInventory,
  getInventoryRole,
  inventoryTotalValue,
  listItems,
} from '../../../../lib/api';
import { CATEGORY_PRESETS } from '../../../../lib/categories';
import { formatMoney } from '../../../../lib/format';
import type { Inventory, Item, Role } from '../../../../lib/types';

export default function InventoryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inv, setInv] = useState<Inventory | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [role, setRole] = useState<'owner' | Role | null>(null);
  const [total, setTotal] = useState<{ total: number; currency: string }>({
    total: 0,
    currency: 'USD',
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [_inv, _items, _role, _total] = await Promise.all([
        getInventory(id),
        listItems(id, { search, category: category ?? undefined }),
        getInventoryRole(id),
        inventoryTotalValue(id),
      ]);
      setInv(_inv);
      setItems(_items);
      setRole(_role);
      setTotal(_total);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, search, category]);

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
  if (!inv) {
    return (
      <View style={styles.center}>
        <Text>Inventory not found.</Text>
      </View>
    );
  }

  const canWrite = role === 'owner' || role === 'contributor';
  const isOwner = role === 'owner';

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>{inv.name}</Text>
        {inv.description ? <Text style={styles.desc}>{inv.description}</Text> : null}
        <Text style={styles.total}>
          Total estimated value:{' '}
          <Text style={styles.totalAmount}>{formatMoney(total.total, total.currency)}</Text>
        </Text>
        <View style={styles.headerActions}>
          {isOwner && (
            <Link href={`/(app)/inventory/${id}/settings`} asChild>
              <Pressable style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Settings</Text>
              </Pressable>
            </Link>
          )}
          <Link href={`/(app)/inventory/${id}/labels`} asChild>
            <Pressable style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Print labels</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={load}
        returnKeyType="search"
        placeholder="Search items…"
        style={styles.search}
      />

      <ScrollView
        horizontal
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
      >
        <Pressable
          style={[styles.chip, category == null && styles.chipActive]}
          onPress={() => {
            setCategory(null);
          }}
        >
          <Text style={category == null ? styles.chipTextActive : styles.chipText}>
            All
          </Text>
        </Pressable>
        {CATEGORY_PRESETS.map((c) => (
          <Pressable
            key={c.key}
            style={[styles.chip, category === c.key && styles.chipActive]}
            onPress={() => setCategory(category === c.key ? null : c.key)}
          >
            <Text style={category === c.key ? styles.chipTextActive : styles.chipText}>
              {c.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No items yet. {canWrite ? 'Tap “Add item” below to start.' : ''}
          </Text>
        }
        renderItem={({ item }) => (
          <Link href={`/(app)/inventory/${id}/item/${item.id}`} asChild>
            <Pressable style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.category ?? 'Uncategorized'}
                  {item.intended_recipient_name ? `  •  for ${item.intended_recipient_name}` : ''}
                </Text>
              </View>
              <Text style={styles.itemValue}>
                {formatMoney(item.value_amount, item.value_currency)}
              </Text>
            </Pressable>
          </Link>
        )}
      />

      {canWrite && (
        <View style={styles.fabWrap}>
          <Pressable
            style={styles.fab}
            onPress={() => router.push(`/(app)/inventory/${id}/item/new`)}
          >
            <Text style={styles.fabText}>+ Add item</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, paddingBottom: 8, gap: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  desc: { color: '#4b5563' },
  total: { color: '#4b5563', marginTop: 6 },
  totalAmount: { color: '#111827', fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  headerButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  headerButtonText: { color: '#111827', fontWeight: '500' },
  search: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
  },
  filterRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
  },
  chipActive: { backgroundColor: '#111827' },
  chipText: { color: '#374151' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 32 },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 12,
  },
  itemName: { fontSize: 16, fontWeight: '500', color: '#111827' },
  itemMeta: { color: '#6b7280', marginTop: 2, fontSize: 12 },
  itemValue: { fontWeight: '600', color: '#111827' },
  fabWrap: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  fab: { backgroundColor: '#111827', padding: 16, borderRadius: 24, alignItems: 'center' },
  fabText: { color: 'white', fontWeight: '600' },
});
