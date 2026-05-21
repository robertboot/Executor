import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import ItemDetailView from '../../../../components/ItemDetailView';
import {
  getInventory,
  getInventoryRole,
  inventoryTotalValue,
  listItems,
  type ItemSort,
} from '../../../../lib/api';
import { CATEGORY_PRESETS } from '../../../../lib/categories';
import { formatMoney } from '../../../../lib/format';
import { colors, radius, shadows } from '../../../../lib/theme';
import { useBreakpoint } from '../../../../lib/useBreakpoint';
import type { Inventory, Item, Role } from '../../../../lib/types';

const SORT_OPTIONS: Array<{ key: ItemSort; label: string }> = [
  { key: 'recent', label: 'Recent' },
  { key: 'name', label: 'Name A–Z' },
  { key: 'value_desc', label: 'Value high→low' },
  { key: 'value_asc', label: 'Value low→high' },
];

export default function InventoryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isWide } = useBreakpoint();
  const [inv, setInv] = useState<Inventory | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [role, setRole] = useState<'owner' | Role | null>(null);
  const [total, setTotal] = useState<{ total: number; currency: string }>({
    total: 0,
    currency: 'USD',
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<ItemSort>('recent');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [_inv, _items, _role, _total] = await Promise.all([
        getInventory(id),
        listItems(id, { search, category: category ?? undefined, sort }),
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
  }, [id, search, category, sort]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // On wide screens, auto-select the first item if nothing is selected yet
  // and the list isn't empty — so the right panel never sits empty.
  useEffect(() => {
    if (isWide && !selectedItemId && items.length > 0) {
      setSelectedItemId(items[0].id);
    }
  }, [isWide, items, selectedItemId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.forest} />
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

  const onItemPress = (item: Item) => {
    if (isWide) {
      setSelectedItemId(item.id);
    } else {
      router.push(`/(app)/inventory/${id}/item/${item.id}`);
    }
  };

  const listPanel = (
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
            <Pressable
              style={styles.headerButton}
              onPress={() => router.push(`/(app)/inventory/${id}/settings`)}
            >
              <Text style={styles.headerButtonText}>Settings</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push(`/(app)/inventory/${id}/labels`)}
          >
            <Text style={styles.headerButtonText}>Print labels</Text>
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push(`/(app)/inventory/${id}/export`)}
          >
            <Text style={styles.headerButtonText}>Export</Text>
          </Pressable>
        </View>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={load}
        returnKeyType="search"
        placeholder="Search items…"
        placeholderTextColor={colors.mutedSoft}
        style={styles.search}
      />

      <ScrollView
        horizontal
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
      >
        <Pressable
          style={[styles.chip, category == null && styles.chipActive]}
          onPress={() => setCategory(null)}
        >
          <Text style={category == null ? styles.chipTextActive : styles.chipText}>
            All
          </Text>
        </Pressable>
        {CATEGORY_PRESETS.filter((c) => !c.custom).map((c) => (
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

      <ScrollView
        horizontal
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
      >
        <Text style={styles.sortLabel}>Sort:</Text>
        {SORT_OPTIONS.map((o) => (
          <Pressable
            key={o.key}
            style={[styles.chipSmall, sort === o.key && styles.chipActive]}
            onPress={() => setSort(o.key)}
          >
            <Text style={sort === o.key ? styles.chipTextActive : styles.chipText}>
              {o.label}
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
            No items yet. {canWrite ? 'Tap "+ Add item" below to start.' : ''}
          </Text>
        }
        renderItem={({ item }) => {
          const isSelected = isWide && item.id === selectedItemId;
          return (
            <Pressable
              style={[styles.itemRow, isSelected && styles.itemRowSelected]}
              onPress={() => onItemPress(item)}
            >
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
          );
        }}
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

  // Phone layout — single column, navigation push on tap
  if (!isWide) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }}>{listPanel}</View>;
  }

  // Tablet / desktop — master-detail side by side
  return (
    <View style={styles.row}>
      <View style={styles.masterCol}>{listPanel}</View>
      <View style={styles.detailCol}>
        {selectedItemId ? (
          <ItemDetailView
            inventoryId={id!}
            itemId={selectedItemId}
            embedded
          />
        ) : (
          <View style={styles.emptyDetail}>
            <Text style={styles.emptyDetailText}>
              Pick an item from the list to see its details here.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },

  row: { flex: 1, flexDirection: 'row', backgroundColor: colors.cream },
  masterCol: {
    flex: 0,
    flexBasis: '42%',
    maxWidth: 520,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
    backgroundColor: colors.cream,
  },
  detailCol: { flex: 1, backgroundColor: colors.cream },
  emptyDetail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyDetailText: { color: colors.muted, textAlign: 'center' },

  header: { padding: 16, paddingBottom: 8, gap: 4 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  desc: { color: colors.muted },
  total: { color: colors.muted, marginTop: 6 },
  totalAmount: { color: colors.ink, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  headerButton: {
    backgroundColor: colors.paper,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  headerButtonText: { color: colors.ink, fontWeight: '500' },
  search: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.paper,
    color: colors.ink,
  },
  filterRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.paper,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.paper,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  sortLabel: { color: colors.muted, alignSelf: 'center', marginRight: 4, fontSize: 12 },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { color: colors.inkSoft },
  chipTextActive: { color: colors.onForest, fontWeight: '600' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 32 },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    gap: 12,
    ...shadows.card,
  },
  itemRowSelected: {
    borderColor: colors.gold,
    borderWidth: 2,
    backgroundColor: colors.creamSoft,
  },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.ink },
  itemMeta: { color: colors.muted, marginTop: 2, fontSize: 12 },
  itemValue: { fontWeight: '700', color: colors.ink },
  fabWrap: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  fab: {
    backgroundColor: colors.forest,
    padding: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  fabText: { color: colors.onForest, fontWeight: '700' },
});
