import { useFocusEffect, useRouter } from 'expo-router';
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
import {
  listMyCollectionsRich,
  type CollectionWithStats,
} from '../../lib/api';
import { findCategory, glyphForCategory } from '../../lib/categories';
import { colors, radius, shadows } from '../../lib/theme';

export default function Collections() {
  const router = useRouter();
  const [items, setItems] = useState<CollectionWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listMyCollectionsRich();
      setItems(data);
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
          <Text style={styles.title}>Collections</Text>
          <Text style={styles.subtitle}>Organize your items by what matters most.</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {items.map((c) => (
          <CollectionCard
            key={c.id ?? c.name}
            c={c}
            onPress={() =>
              router.push({
                pathname: '/(app)/collections/[key]',
                params: { key: c.name },
              })
            }
          />
        ))}
        <AddTile onPress={() => router.push('/(app)/collections/new')} />
      </View>

      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Text style={styles.bannerGlyph}>◇</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>
            Collections make it easy to organize and share.
          </Text>
          <Text style={styles.bannerBody}>
            Group similar items, assign people to look after them, and keep
            everything organized for today and tomorrow.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function CollectionCard({
  c,
  onPress,
}: {
  c: CollectionWithStats;
  onPress: () => void;
}) {
  const preset = findCategory(c.name);
  const displayName = preset?.label ?? c.name;
  const glyph = preset?.glyph ?? glyphForCategory(c.name);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHero}>
        {preset?.iconAsset ? (
          <Image
            source={preset.iconAsset}
            style={styles.cardImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.cardImageEmpty}>
            <Text style={styles.cardImageGlyph}>{glyph}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMetaGlyph}>◰</Text>
          <Text style={styles.cardMeta}>
            {c.itemCount} item{c.itemCount === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={styles.sharedRow}>
          <Text style={styles.sharedLabel}>Shared with</Text>
          <View style={styles.avatars}>
            {c.sharedWithEmails.length === 0 ? (
              <Text style={styles.sharedNone}>Just you</Text>
            ) : (
              <>
                {c.sharedWithEmails.slice(0, 3).map((email) => (
                  <View key={email} style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(email)}</Text>
                  </View>
                ))}
                {c.sharedWithEmails.length > 3 && (
                  <View style={[styles.avatar, styles.avatarPlus]}>
                    <Text style={styles.avatarText}>
                      +{c.sharedWithEmails.length - 3}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function AddTile({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={[styles.card, styles.addTile]} onPress={onPress}>
      <View style={styles.addCircle}>
        <Text style={styles.addPlus}>+</Text>
      </View>
      <Text style={styles.addTitle}>Add a Collection</Text>
      <Text style={styles.addHelp}>Create a new collection for your items</Text>
    </Pressable>
  );
}

function initials(email: string): string {
  const local = (email.split('@')[0] || email).replace(/[^a-z]/gi, '');
  if (!local) return '?';
  return local.slice(0, 2).toUpperCase();
}

const CARD_WIDTH = '48%';

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16, paddingBottom: 80, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: CARD_WIDTH,
    flexGrow: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardHero: { aspectRatio: 1.1, backgroundColor: colors.paper },
  cardImage: { width: '100%', height: '100%' },
  cardImageEmpty: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageGlyph: { fontSize: 64 },
  cardBody: { padding: 12, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaGlyph: { color: colors.gold, fontSize: 14 },
  cardMeta: { color: colors.muted, fontSize: 13 },
  sharedRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.divider },
  sharedLabel: { color: colors.muted, fontSize: 11, marginBottom: 4 },
  avatars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlus: { backgroundColor: colors.gold },
  avatarText: { color: colors.onForest, fontSize: 10, fontWeight: '700' },
  sharedNone: { color: colors.muted, fontSize: 12, fontStyle: 'italic' },

  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: colors.gold,
    minHeight: 250,
    gap: 8,
  },
  addCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: { fontSize: 32, color: colors.forest },
  addTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 6 },
  addHelp: { color: colors.muted, textAlign: 'center', fontSize: 13 },

  banner: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: 12,
    alignItems: 'center',
    ...shadows.card,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerGlyph: { color: colors.forest, fontSize: 20 },
  bannerTitle: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  bannerBody: { color: colors.muted, fontSize: 13, marginTop: 2, lineHeight: 18 },
});
