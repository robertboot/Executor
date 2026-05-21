import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Logo from '../../components/Logo';
import {
  dashboardStats,
  listMyInventories,
  listMyPendingInvites,
  photoPublicUrl,
} from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { findCategory, labelForCategory } from '../../lib/categories';
import { formatMoney } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { colors, radius, shadows } from '../../lib/theme';
import type { InventoryShare, InventoryWithRole } from '../../lib/types';

const SERIF = { fontFamily: 'Georgia' };

interface Stats {
  itemCount: number;
  inventoryCount: number;
  totalValue: number;
  totalCurrency: string;
  conservatorCount: number;
  taggedForSaleCount: number;
}

interface RecentItem {
  id: string;
  inventory_id: string;
  name: string;
  category: string | null;
  location: string | null;
  value_amount: number | null;
  value_currency: string;
  photo_path: string | null;
}

interface CollectionPreview {
  key: string;
  label: string;
  count: number;
  iconAsset: number | null;
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [inventories, setInventories] = useState<InventoryWithRole[]>([]);
  const [invites, setInvites] = useState<InventoryShare[]>([]);
  const [stats, setStats] = useState<Stats>({
    itemCount: 0,
    inventoryCount: 0,
    totalValue: 0,
    totalCurrency: 'USD',
    conservatorCount: 0,
    taggedForSaleCount: 0,
  });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [collections, setCollections] = useState<CollectionPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      try {
        setInventories(await listMyInventories());
      } catch {}
      try {
        setInvites(await listMyPendingInvites());
      } catch {}
      try {
        setStats(await dashboardStats());
      } catch {}
      try {
        const { data } = await supabase
          .from('items')
          .select(
            'id, inventory_id, name, category, location, value_amount, value_currency, created_at, item_photos(storage_path, sort_order)',
          )
          .order('created_at', { ascending: false })
          .limit(4);
        const list = (data ?? []) as Array<{
          id: string;
          inventory_id: string;
          name: string;
          category: string | null;
          location: string | null;
          value_amount: number | null;
          value_currency: string;
          item_photos: { storage_path: string; sort_order: number }[] | null;
        }>;
        setRecent(
          list.map((it) => ({
            id: it.id,
            inventory_id: it.inventory_id,
            name: it.name,
            category: it.category,
            location: it.location,
            value_amount: it.value_amount,
            value_currency: it.value_currency,
            photo_path: it.item_photos?.[0]?.storage_path ?? null,
          })),
        );
      } catch {}
      try {
        const { data } = await supabase.from('items').select('category');
        const counts = new Map<string, number>();
        for (const r of (data ?? []) as { category: string | null }[]) {
          if (!r.category) continue;
          counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
        }
        const preview = [...counts.entries()]
          .map(([k, count]) => {
            const preset = findCategory(k);
            return {
              key: k,
              label: preset?.label ?? labelForCategory(k),
              count,
              iconAsset: preset?.iconAsset ?? null,
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setCollections(preview);
      } catch {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  const firstName =
    user?.user_metadata?.display_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={colors.forest}
        />
      }
    >
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Logo />
        </View>
        <Pressable
          style={styles.gear}
          onPress={() => router.push('/(app)/settings')}
        >
          <Text style={styles.gearGlyph}>⚙</Text>
        </Pressable>
      </View>

      <View>
        <Text style={[styles.welcome, SERIF]}>Welcome back, {firstName} 👋</Text>
        <Text style={styles.subWelcome}>Here&apos;s what&apos;s happening.</Text>
      </View>

      {invites.length > 0 && (
        <Pressable
          style={styles.inviteBanner}
          onPress={() => router.push('/(app)/invites')}
        >
          <Text style={styles.inviteText}>
            {invites.length} pending invite{invites.length === 1 ? '' : 's'} — tap to review
          </Text>
        </Pressable>
      )}

      <View style={styles.statList}>
        <StatRow
          glyph="▢"
          value={String(stats.itemCount)}
          label="Items Cataloged"
          tone="sage"
          onPress={() => router.push('/(app)/collections')}
        />
        <StatRow
          glyph="◊"
          value={formatMoney(stats.totalValue, stats.totalCurrency)}
          label="Total Estimated Value"
          tone="gold"
          onPress={() => router.push('/(app)/collections')}
        />
        <StatRow
          glyph="◯"
          value={String(stats.conservatorCount)}
          label="Conservators Assigned"
          tone="lilac"
          onPress={() => router.push('/(app)/conservators')}
        />
        <StatRow
          glyph="⛨"
          value={String(stats.taggedForSaleCount)}
          label="Items Tagged for Sale"
          tone="periwinkle"
          onPress={() => router.push('/(app)/collections')}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Items</Text>
        {inventories.length > 0 && (
          <Pressable
            onPress={() => router.push(`/(app)/inventory/${inventories[0].id}`)}
          >
            <Text style={styles.sectionAction}>View all</Text>
          </Pressable>
        )}
      </View>

      {recent.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            You don&apos;t have any items yet. Create an inventory and add your first
            piece.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push('/(app)/new-inventory')}
          >
            <Text style={styles.primaryBtnText}>+ New inventory</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.recentList}>
          {recent.map((it, idx) => (
            <Link
              key={it.id}
              href={`/(app)/inventory/${it.inventory_id}/item/${it.id}`}
              asChild
            >
              <Pressable
                style={[styles.recentRow, idx > 0 && styles.recentRowDivider]}
              >
                <View style={styles.recentThumb}>
                  {it.photo_path ? (
                    <Image
                      source={{ uri: photoPublicUrl(it.photo_path) }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.recentThumbGlyph}>❦</Text>
                  )}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.recentName, SERIF]} numberOfLines={1}>
                    {it.name}
                  </Text>
                  <Text style={styles.recentMeta} numberOfLines={1}>
                    {labelForCategory(it.category)}
                  </Text>
                  {it.location ? (
                    <View style={styles.locChip}>
                      <Text style={styles.locChipText}>{it.location}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.recentValueWrap}>
                  <Text style={styles.recentValue}>
                    {formatMoney(it.value_amount, it.value_currency)}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Collections</Text>
        <Pressable onPress={() => router.push('/(app)/collections')}>
          <Text style={styles.sectionAction}>View all</Text>
        </Pressable>
      </View>

      {collections.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Add a collection to start grouping your items.
          </Text>
        </View>
      ) : (
        <View style={styles.recentList}>
          {collections.map((c, idx) => (
            <Pressable
              key={c.key}
              style={[styles.collRow, idx > 0 && styles.recentRowDivider]}
              onPress={() =>
                router.push({
                  pathname: '/(app)/collections/[key]',
                  params: { key: c.key },
                })
              }
            >
              <View style={styles.collIcon}>
                {c.iconAsset ? (
                  <Image
                    source={c.iconAsset}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.collIconGlyph}>◇</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.collName}>{c.label}</Text>
                <Text style={styles.collMeta}>
                  {c.count} item{c.count === 1 ? '' : 's'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        style={styles.addItemTile}
        onPress={() => {
          const writable = inventories.find(
            (i) => i.role === 'owner' || i.role === 'contributor',
          );
          if (writable) {
            router.push(`/(app)/inventory/${writable.id}/item/new`);
          } else {
            router.push('/(app)/new-inventory');
          }
        }}
      >
        <Text style={styles.addItemPlus}>+</Text>
        <Text style={styles.addItemText}>Add New Item</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatRow({
  glyph,
  value,
  label,
  tone,
  onPress,
}: {
  glyph: string;
  value: string;
  label: string;
  tone: 'sage' | 'gold' | 'lilac' | 'periwinkle';
  onPress: () => void;
}) {
  const palette = TONES[tone];
  return (
    <Pressable style={styles.stat} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: palette.bg }]}>
        <Text style={[styles.statGlyph, { color: palette.fg }]}>{glyph}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.statValue, SERIF]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const TONES = {
  sage: { bg: '#DCEBE0', fg: '#3E7A5C' },
  gold: { bg: '#F2E6D0', fg: '#A07B3E' },
  lilac: { bg: '#E4DFEE', fg: '#6F5BA0' },
  periwinkle: { bg: '#DDE3F1', fg: '#4F6FAF' },
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16, paddingBottom: 100, gap: 18 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  brand: { flex: 1, alignItems: 'center', marginTop: 8 },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  gearGlyph: { color: colors.ink, fontSize: 18 },

  welcome: { fontSize: 26, fontWeight: '700', color: colors.ink },
  subWelcome: { color: colors.muted, marginTop: 2 },

  inviteBanner: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.gold,
    borderWidth: 1,
    padding: 12,
    borderRadius: radius.md,
  },
  inviteText: { color: colors.goldDeep, fontWeight: '600' },

  statList: { gap: 10 },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: 14,
    ...shadows.card,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statGlyph: { fontSize: 20, fontWeight: '700' },
  statValue: { fontSize: 22, color: colors.ink, fontWeight: '700' },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.ink },
  sectionAction: { color: colors.gold, fontWeight: '700' },

  recentList: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.card,
  },
  recentRow: { flexDirection: 'row', padding: 12, gap: 12, alignItems: 'center' },
  recentRowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  recentThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentThumbGlyph: { color: colors.gold, fontSize: 24 },
  recentName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  recentMeta: { fontSize: 13, color: colors.muted },
  locChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.creamSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  locChipText: { color: colors.inkSoft, fontSize: 11, fontWeight: '600' },
  recentValueWrap: { alignItems: 'flex-end', gap: 4 },
  recentValue: { color: colors.ink, fontWeight: '700' },
  chevron: { color: colors.mutedSoft, fontSize: 22 },

  collRow: { flexDirection: 'row', padding: 12, gap: 12, alignItems: 'center' },
  collIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collIconGlyph: { color: colors.forest, fontSize: 18 },
  collName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  collMeta: { color: colors.muted, fontSize: 12 },

  emptyCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 18,
    gap: 12,
    ...shadows.card,
  },
  emptyText: { color: colors.muted, lineHeight: 20 },

  primaryBtn: {
    backgroundColor: colors.forest,
    padding: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.onForest, fontWeight: '700' },

  addItemTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.lg,
    paddingVertical: 16,
    marginTop: 8,
  },
  addItemPlus: { color: colors.forest, fontSize: 22, fontWeight: '700' },
  addItemText: { color: colors.ink, fontWeight: '700', fontSize: 16 },
});
