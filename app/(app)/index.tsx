import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Disclaimer from '../../components/Disclaimer';
import Logo from '../../components/Logo';
import { useAuth } from '../../lib/auth';
import {
  createDemoInventory,
  listMyInventories,
  listMyPendingInvites,
  photoPublicUrl,
} from '../../lib/api';
import { labelForCategory } from '../../lib/categories';
import { formatMoney } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { brand, colors, radius, shadows } from '../../lib/theme';
import type { InventoryShare, InventoryWithRole } from '../../lib/types';

interface Stats {
  itemCount: number;
  inventoryCount: number;
  totalValue: number;
  totalCurrency: string;
  bequestedCount: number;
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
    bequestedCount: 0,
  });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [collections, setCollections] = useState<CollectionPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, inv, itemsRes] = await Promise.all([
        listMyInventories(),
        listMyPendingInvites(),
        supabase
          .from('items')
          .select(
            'id, inventory_id, name, category, location, value_amount, value_currency, intended_recipient_name, created_at, item_photos(storage_path)',
          )
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      setInventories(list);
      setInvites(inv);

      const items = (itemsRes.data ?? []) as Array<{
        id: string;
        inventory_id: string;
        name: string;
        category: string | null;
        location: string | null;
        value_amount: number | null;
        value_currency: string;
        intended_recipient_name: string | null;
        item_photos: { storage_path: string }[] | null;
      }>;

      let total = 0;
      let currency = 'USD';
      let bequested = 0;
      const collMap = new Map<string, number>();
      for (const it of items) {
        if (it.value_amount != null) {
          total += Number(it.value_amount);
          currency = it.value_currency || currency;
        }
        if (it.intended_recipient_name) bequested += 1;
        const k = it.category ?? '__uncategorized';
        collMap.set(k, (collMap.get(k) ?? 0) + 1);
      }

      setStats({
        itemCount: items.length,
        inventoryCount: list.length,
        totalValue: total,
        totalCurrency: currency,
        bequestedCount: bequested,
      });

      setRecent(
        items.slice(0, 4).map((it) => ({
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

      const colls = [...collMap.entries()]
        .map(([k, count]) => ({
          key: k,
          label: k === '__uncategorized' ? 'Uncategorized' : labelForCategory(k),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setCollections(colls);
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
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcome}>Welcome back, {firstName} 👋</Text>
          <Text style={styles.subWelcome}>
            Here&apos;s what&apos;s happening with your heirlooms.
          </Text>
        </View>
        <Logo variant="compact" />
      </View>

      {invites.length > 0 && (
        <Pressable
          style={styles.inviteBanner}
          onPress={() => router.push('/(app)/invites')}
        >
          <Text style={styles.inviteText}>
            You have {invites.length} pending invite{invites.length === 1 ? '' : 's'} — tap to review
          </Text>
        </Pressable>
      )}

      <View style={styles.statsRow}>
        <StatCard
          glyph="◰"
          label="Items cataloged"
          value={String(stats.itemCount)}
          tone="gold"
        />
        <StatCard
          glyph="$"
          label="Total est. value"
          value={formatMoney(stats.totalValue, stats.totalCurrency)}
          tone="forest"
        />
        <StatCard
          glyph="✿"
          label="With recipients"
          value={String(stats.bequestedCount)}
          tone="gold"
        />
        <StatCard
          glyph="❐"
          label="Inventories"
          value={String(stats.inventoryCount)}
          tone="forest"
        />
      </View>

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <SectionHeader
            title="Recent items"
            action={inventories.length > 0 ? 'View all' : undefined}
            onAction={
              inventories.length > 0
                ? () => router.push(`/(app)/inventory/${inventories[0].id}`)
                : undefined
            }
          />
          {recent.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                You don&apos;t have any items yet. Create an inventory and add your first
                piece.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Pressable
                  style={styles.primary}
                  onPress={() => router.push('/(app)/new-inventory')}
                >
                  <Text style={styles.primaryText}>+ New inventory</Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={async () => {
                    try {
                      const inv = await createDemoInventory();
                      router.push(`/(app)/inventory/${inv.id}`);
                    } catch (e: any) {
                      Alert.alert('Could not create demo', e?.message ?? String(e));
                    }
                  }}
                >
                  <Text style={styles.secondaryText}>Try sample data</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.listCard}>
              {recent.map((it, idx) => (
                <Link
                  key={it.id}
                  href={`/(app)/inventory/${it.inventory_id}/item/${it.id}`}
                  asChild
                >
                  <Pressable style={[styles.itemRow, idx > 0 && styles.itemRowDivider]}>
                    <View style={styles.thumb}>
                      {it.photo_path ? (
                        <View style={styles.thumbImg}>
                          <ThumbImage path={it.photo_path} />
                        </View>
                      ) : (
                        <Text style={styles.thumbGlyph}>❦</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{it.name}</Text>
                      <Text style={styles.itemMeta}>
                        {labelForCategory(it.category)}
                        {it.location ? `  •  ${it.location}` : ''}
                      </Text>
                      {it.location && (
                        <View style={styles.locationChip}>
                          <Text style={styles.locationChipText}>{it.location}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemValue}>
                      {formatMoney(it.value_amount, it.value_currency)}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>

        <View style={styles.col}>
          <SectionHeader
            title="Collections"
            action="View all"
            onAction={() => router.push('/(app)/collections')}
          />
          {collections.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Items you add will be grouped by their collection tag here.
              </Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {collections.map((c, idx) => (
                <Pressable
                  key={c.key}
                  style={[styles.collRow, idx > 0 && styles.itemRowDivider]}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/collections/[key]',
                      params: { key: c.key },
                    })
                  }
                >
                  <View style={styles.collIcon}>
                    <Text style={styles.collIconGlyph}>◇</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{c.label}</Text>
                    <Text style={styles.itemMeta}>
                      {c.count} item{c.count === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.inventoriesSection}>
        <SectionHeader title="Your inventories" />
        {inventories.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              An inventory is a place — your study, your jewelry box, the garage.
            </Text>
            <Pressable
              style={styles.primary}
              onPress={() => router.push('/(app)/new-inventory')}
            >
              <Text style={styles.primaryText}>+ New inventory</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {inventories.map((inv) => (
              <Link key={inv.id} href={`/(app)/inventory/${inv.id}`} asChild>
                <Pressable style={styles.invCard}>
                  <Text style={styles.invName}>{inv.name}</Text>
                  {inv.description ? (
                    <Text style={styles.invDesc} numberOfLines={2}>
                      {inv.description}
                    </Text>
                  ) : null}
                  <Text style={styles.invRole}>
                    {inv.role === 'owner'
                      ? 'Owner'
                      : inv.role === 'contributor'
                        ? 'Contributor'
                        : 'Viewer'}
                  </Text>
                </Pressable>
              </Link>
            ))}
            <Pressable
              style={[styles.invCard, styles.invCardAdd]}
              onPress={() => router.push('/(app)/new-inventory')}
            >
              <Text style={styles.addPlus}>+</Text>
              <Text style={styles.invRole}>New inventory</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.motto}>
        <Text style={styles.mottoText}>{brand.motto}</Text>
      </View>

      <Disclaimer compact />
    </ScrollView>
  );
}

function StatCard({
  glyph,
  label,
  value,
  tone,
}: {
  glyph: string;
  label: string;
  value: string;
  tone: 'gold' | 'forest';
}) {
  const accent = tone === 'gold' ? colors.gold : colors.forest;
  const bg = tone === 'gold' ? colors.goldSoft : colors.creamSoft;
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Text style={[styles.statGlyph, { color: accent }]}>{glyph}</Text>
      </View>
      <Text style={[styles.statValue, tone === 'gold' && { color: colors.goldDeep }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function ThumbImage({ path }: { path: string }) {
  return (
    <Image
      source={{ uri: photoPublicUrl(path) }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16, paddingBottom: 80, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  welcome: { fontSize: 24, fontWeight: '700', color: colors.ink },
  subWelcome: { color: colors.muted, marginTop: 2 },

  inviteBanner: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.gold,
    borderWidth: 1,
    padding: 12,
    borderRadius: radius.md,
  },
  inviteText: { color: colors.goldDeep, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  stat: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.card,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statGlyph: { fontSize: 18, fontWeight: '700' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },

  twoCol: { gap: 16 },
  col: { gap: 8 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  sectionAction: { color: colors.gold, fontWeight: '600' },

  listCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.card,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  itemRowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbGlyph: { color: colors.gold, fontSize: 24 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  itemMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  itemValue: { fontWeight: '700', color: colors.forest },
  locationChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  locationChipText: { color: colors.goldDeep, fontSize: 11, fontWeight: '600' },

  collRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  collIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collIconGlyph: { color: colors.forest, fontSize: 18 },
  chevron: { color: colors.mutedSoft, fontSize: 22 },

  inventoriesSection: { gap: 8 },
  invCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 96,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.card,
  },
  invCardAdd: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  invName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  invDesc: { color: colors.muted, marginTop: 4, fontSize: 13 },
  invRole: {
    marginTop: 8,
    fontSize: 11,
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  addPlus: { fontSize: 32, color: colors.gold },

  emptyCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: 12,
    ...shadows.card,
  },
  emptyText: { color: colors.muted, lineHeight: 20 },

  primary: {
    backgroundColor: colors.forest,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  primaryText: { color: colors.onForest, fontWeight: '700' },
  secondary: {
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  secondaryText: { color: colors.goldDeep, fontWeight: '700' },

  motto: {
    backgroundColor: colors.forest,
    padding: 18,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: 8,
  },
  mottoText: {
    color: colors.gold,
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 14,
  },
});
