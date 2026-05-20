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
import Logo from '../../components/Logo';
import { useAuth } from '../../lib/auth';
import {
  createDemoInventory,
  dashboardStats,
  listMyInventories,
  listMyPendingInvites,
  photoPublicUrl,
} from '../../lib/api';
import { labelForCategory } from '../../lib/categories';
import { formatMoney } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { colors, radius, shadows } from '../../lib/theme';
import type { InventoryShare, InventoryWithRole } from '../../lib/types';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      try {
        setInventories(await listMyInventories());
      } catch (e) {
        console.warn('listMyInventories failed', e);
        setInventories([]);
      }
      try {
        setInvites(await listMyPendingInvites());
      } catch (e) {
        console.warn('listMyPendingInvites failed', e);
        setInvites([]);
      }
      try {
        setStats(await dashboardStats());
      } catch (e) {
        console.warn('dashboardStats failed', e);
      }
      try {
        const recRes = await supabase
          .from('items')
          .select(
            'id, inventory_id, name, category, value_amount, value_currency, created_at, item_photos(storage_path, sort_order)',
          )
          .order('created_at', { ascending: false })
          .limit(4);
        const recentItems = (recRes.data ?? []) as Array<{
          id: string;
          inventory_id: string;
          name: string;
          category: string | null;
          value_amount: number | null;
          value_currency: string;
          item_photos: { storage_path: string; sort_order: number }[] | null;
        }>;
        setRecent(
          recentItems.map((it) => ({
            id: it.id,
            inventory_id: it.inventory_id,
            name: it.name,
            category: it.category,
            value_amount: it.value_amount,
            value_currency: it.value_currency,
            photo_path: it.item_photos?.[0]?.storage_path ?? null,
          })),
        );
      } catch (e) {
        console.warn('recent items query failed', e);
      }
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
      <View style={styles.gearWrap}>
        <Pressable
          style={styles.gear}
          onPress={() => router.push('/(app)/settings')}
        >
          <Text style={styles.gearGlyph}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.brandBlock}>
        <Logo />
      </View>

      <View>
        <Text style={styles.welcome}>Welcome back, {firstName} 👋</Text>
        <Text style={styles.subWelcome}>Here&apos;s what&apos;s happening.</Text>
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

      <View style={styles.statList}>
        <StatRow
          glyph="◰"
          value={String(stats.itemCount)}
          label="Items Cataloged"
          tone="sage"
          onPress={() => router.push('/(app)/collections')}
        />
        <StatRow
          glyph="◇"
          value={formatMoney(stats.totalValue, stats.totalCurrency)}
          label="Total Estimated Value"
          tone="gold"
          onPress={() => router.push('/(app)/collections')}
        />
        <StatRow
          glyph="👥"
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
                    <Image
                      source={{ uri: photoPublicUrl(it.photo_path) }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <Text style={styles.thumbGlyph}>❦</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {it.name}
                  </Text>
                  <Text style={styles.itemMeta}>{labelForCategory(it.category)}</Text>
                  <Text style={styles.itemValue}>
                    {formatMoney(it.value_amount, it.value_currency)}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
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
        <Text style={styles.statValue}>{value}</Text>
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
  gearWrap: { alignItems: 'flex-end', height: 0 },
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

  brandBlock: { alignItems: 'center', marginTop: 8 },

  welcome: { fontSize: 22, fontWeight: '700', color: colors.ink },
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
    gap: 12,
    ...shadows.card,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statGlyph: { fontSize: 22, fontWeight: '700' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
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
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbGlyph: { color: colors.gold, fontSize: 24 },
  itemName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  itemMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  itemValue: { fontSize: 13, color: colors.forest, marginTop: 4, fontWeight: '600' },
  chevron: { color: colors.mutedSoft, fontSize: 22 },

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
});
