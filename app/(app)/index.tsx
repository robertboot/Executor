import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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
  const { width } = useWindowDimensions();
  const isTablet = width >= 700;
  const isDesktop = width >= 1100;
  const contentMaxWidth = isDesktop ? 1080 : isTablet ? 760 : '100%';
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

  const load = useCallback(async () => {
    try {
      try { setInventories(await listMyInventories()); } catch {}
      try { setInvites(await listMyPendingInvites()); } catch {}
      try { setStats(await dashboardStats()); } catch {}
      try {
        const { data } = await supabase
          .from('items')
          .select(
            'id, inventory_id, name, category, value_amount, value_currency, created_at, item_photos(storage_path, sort_order)',
          )
          .order('created_at', { ascending: false })
          .limit(4);
        const list = (data ?? []) as Array<{
          id: string;
          inventory_id: string;
          name: string;
          category: string | null;
          value_amount: number | null;
          value_currency: string;
          item_photos: { storage_path: string; sort_order: number }[] | null;
        }>;
        setRecent(
          list.map((it) => {
            const sortedPhotos = (it.item_photos ?? [])
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order);
            return {
              id: it.id,
              inventory_id: it.inventory_id,
              name: it.name,
              category: it.category,
              value_amount: it.value_amount,
              value_currency: it.value_currency,
              photo_path: sortedPhotos[0]?.storage_path ?? null,
            };
          }),
        );
      } catch {}
      try {
        const { data } = await supabase.from('items').select('category');
        const counts = new Map<string, number>();
        for (const r of (data ?? []) as { category: string | null }[]) {
          if (r.category) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
        }
        setCollections(
          [...counts.entries()]
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
            .slice(0, 5),
        );
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
    <ScrollView style={{ backgroundColor: colors.cream }}>
      <View
        style={[
          styles.scroll,
          { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' },
        ]}
      >
        <View style={styles.topBar}>
          <Image
            source={require('../../assets/heirloom-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Pressable
            style={styles.gear}
            onPress={() => router.push('/(app)/settings')}
          >
            <Text style={styles.gearGlyph}>⚙</Text>
          </Pressable>
        </View>
      <Text style={[styles.welcome, SERIF]}>Welcome back, {firstName} 👋</Text>
      <Text style={styles.subWelcome}>Here&apos;s what&apos;s happening.</Text>

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

      <StatRow value={String(stats.itemCount)} label="Items Cataloged" tone="sage"
        onPress={() => router.push('/(app)/collections')} />
      <StatRow value={formatMoney(stats.totalValue, stats.totalCurrency)} label="Total Estimated Value" tone="gold"
        onPress={() => router.push('/(app)/collections')} />
      <StatRow value={String(stats.conservatorCount)} label="Conservators Assigned" tone="lilac"
        onPress={() => router.push('/(app)/conservators')} />
      <StatRow value={String(stats.taggedForSaleCount)} label="Items Tagged for Sale" tone="periwinkle"
        onPress={() => router.push('/(app)/collections')} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Items</Text>
        {inventories.length > 0 && (
          <Pressable onPress={() => router.push(`/(app)/inventory/${inventories[0].id}`)}>
            <Text style={styles.sectionAction}>View all</Text>
          </Pressable>
        )}
      </View>

      {recent.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.body}>No items yet.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {recent.map((it, idx) => {
            const dividerStyle = idx > 0 ? styles.rowDivider : null;
            return (
              <Pressable
                key={it.id}
                style={[styles.row, dividerStyle]}
                onPress={() => router.push(`/(app)/inventory/${it.inventory_id}/item/${it.id}`)}
              >
                <View style={styles.thumb}>
                  {it.photo_path ? (
                    <Image
                      source={{ uri: photoPublicUrl(it.photo_path) }}
                      style={styles.thumbImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.thumbGlyph}>❦</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, SERIF]} numberOfLines={1}>{it.name}</Text>
                  <Text style={styles.rowMeta}>{labelForCategory(it.category)}</Text>
                </View>
                <Text style={styles.rowValue}>
                  {formatMoney(it.value_amount, it.value_currency)}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
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
          <Text style={styles.body}>Add a collection to group items.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {collections.map((c, idx) => {
            const dividerStyle = idx > 0 ? styles.rowDivider : null;
            return (
              <Pressable
                key={c.key}
                style={[styles.row, dividerStyle]}
                onPress={() =>
                  router.push({ pathname: '/(app)/collections/[key]', params: { key: c.key } })
                }
              >
                <View style={styles.collIcon}>
                  {c.iconAsset ? (
                    <Image
                      source={c.iconAsset}
                      style={styles.collIconImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.collIconGlyph}>◇</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{c.label}</Text>
                  <Text style={styles.rowMeta}>
                    {c.count} item{c.count === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        style={styles.addItemTile}
        onPress={() => {
          const writable = inventories.find(
            (i) => i.role === 'owner' || i.role === 'contributor',
          );
          if (writable) router.push(`/(app)/inventory/${writable.id}/item/new`);
          else router.push('/(app)/new-inventory');
        }}
      >
        <Text style={styles.addItemPlus}>+</Text>
        <Text style={styles.addItemText}>Add New Item</Text>
      </Pressable>

      <Text style={styles.version}>
        Heirloom v{Constants.expoConfig?.version ?? '0.1.0'}
      </Text>
      </View>
    </ScrollView>
  );
}

function StatRow({
  value,
  label,
  tone,
  onPress,
}: {
  value: string;
  label: string;
  tone: 'sage' | 'gold' | 'lilac' | 'periwinkle';
  onPress: () => void;
}) {
  const palette = TONES[tone];
  return (
    <Pressable style={styles.stat} onPress={onPress}>
      <View style={[styles.statSwatch, { backgroundColor: palette.bg }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.statValue, SERIF, { color: palette.fg }]}>{value}</Text>
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
  loading: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 24, gap: 12 },

  topBar: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  logo: { width: 160, height: 160 },
  gear: {
    position: 'absolute',
    top: 8,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearGlyph: { color: colors.ink, fontSize: 18 },

  brand: { fontSize: 28, fontWeight: '700', color: colors.ink, letterSpacing: 0.5 },
  welcome: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subWelcome: { color: colors.muted, marginTop: -8 },

  inviteBanner: {
    backgroundColor: colors.goldSoft, borderColor: colors.gold, borderWidth: 1,
    padding: 12, borderRadius: radius.md,
  },
  inviteText: { color: colors.goldDeep, fontWeight: '600' },

  stat: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.paper, padding: 14, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.hairline, gap: 14,
    ...shadows.card,
  },
  statSwatch: { width: 48, height: 48, borderRadius: 12 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.ink },
  sectionAction: { color: colors.gold, fontWeight: '700' },

  list: {
    backgroundColor: colors.paper, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.hairline,
    ...shadows.card,
  },
  row: { flexDirection: 'row', padding: 12, gap: 12, alignItems: 'center' },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.creamSoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbGlyph: { color: colors.gold, fontSize: 24 },
  collIcon: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.creamSoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collIconImg: { width: '100%', height: '100%' },
  collIconGlyph: { color: colors.forest, fontSize: 22 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  rowMeta: { fontSize: 13, color: colors.muted },
  rowValue: { color: colors.ink, fontWeight: '700' },
  chevron: { color: colors.mutedSoft, fontSize: 22 },

  emptyCard: {
    backgroundColor: colors.paper, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.hairline,
    padding: 18, gap: 8,
    ...shadows.card,
  },
  body: { color: colors.inkSoft, lineHeight: 22 },

  addItemTile: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.creamSoft, borderRadius: radius.lg,
    paddingVertical: 16, marginTop: 8,
  },
  addItemPlus: { color: colors.forest, fontSize: 22, fontWeight: '700' },
  addItemText: { color: colors.ink, fontWeight: '700', fontSize: 16 },

  version: {
    textAlign: 'center',
    color: colors.mutedSoft,
    fontSize: 11,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
});
