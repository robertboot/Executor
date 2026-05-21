import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  deleteItem,
  getInventoryRole,
  getItem,
  listPhotos,
  photoPublicUrl,
} from '../../../../../../lib/api';
import { findCategory } from '../../../../../../lib/categories';
import { confirm, notify } from '../../../../../../lib/confirm';
import { formatDate, formatMoney } from '../../../../../../lib/format';
import { qrUrlForItem } from '../../../../../../lib/supabase';
import { colors, radius, shadows } from '../../../../../../lib/theme';
import type { Item, ItemPhoto, Role } from '../../../../../../lib/types';

const SERIF = { fontFamily: 'Georgia' };

export default function ItemDetail() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [photos, setPhotos] = useState<ItemPhoto[]>([]);
  const [role, setRole] = useState<'owner' | Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);

  const load = useCallback(async () => {
    if (!itemId || !id) return;
    const [it, ph, r] = await Promise.all([
      getItem(itemId),
      listPhotos(itemId),
      getInventoryRole(id),
    ]);
    setItem(it);
    setPhotos(ph);
    setRole(r);
    setLoading(false);
  }, [itemId, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }
  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Item not found.</Text>
      </View>
    );
  }

  const canEdit = role === 'owner' || role === 'contributor';
  const canDelete = role === 'owner';
  const cat = findCategory(item.category);
  const customEntries = Object.entries(item.custom_fields ?? {}).filter(
    ([, v]) => v != null && v !== '',
  );
  const currentPhoto = photos[photoIdx];

  const onDelete = async () => {
    const ok = await confirm(
      'Delete this item?',
      'This will also remove its photos and history. This cannot be undone.',
    );
    if (!ok) return;
    try {
      await deleteItem(item.id);
      router.replace(`/(app)/inventory/${id}`);
    } catch (e: any) {
      notify('Delete failed', e?.message ?? String(e));
    }
  };

  const onShare = async () => {
    const url = qrUrlForItem(item.public_id);
    try {
      await Share.share({ title: item.name, message: url, url });
    } catch (e: any) {
      notify('Share failed', e?.message ?? String(e));
    }
  };

  const onPreview = () => WebBrowser.openBrowserAsync(qrUrlForItem(item.public_id));

  const cycle = (delta: number) => {
    if (photos.length === 0) return;
    setPhotoIdx((i) => (i + delta + photos.length) % photos.length);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Crumb + actions */}
        <View style={styles.crumb}>
          <Pressable
            onPress={() => router.push(`/(app)/inventory/${id}`)}
            hitSlop={10}
          >
            <Text style={styles.crumbText}>‹ Inventory</Text>
          </Pressable>
          <Text style={styles.crumbSep}>›</Text>
          <Text style={styles.crumbCurrent}>Item</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          {currentPhoto ? (
            <Pressable onPress={() => cycle(1)} style={{ flex: 1 }}>
              <Image
                source={{ uri: photoPublicUrl(currentPhoto.storage_path) }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <View style={[styles.heroImage, styles.heroEmpty]}>
              <Text style={styles.heroEmptyGlyph}>{cat?.glyph ?? '❦'}</Text>
            </View>
          )}

          {cat && (
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>{cat.label}</Text>
            </View>
          )}

          {photos.length > 1 && (
            <View style={styles.heroCount}>
              <Text style={styles.heroCountText}>
                {photoIdx + 1} / {photos.length}
              </Text>
            </View>
          )}

          {item.value_amount != null && (
            <View style={styles.heroValue}>
              <Text style={styles.heroValueText}>
                {formatMoney(item.value_amount, item.value_currency)}
              </Text>
            </View>
          )}

          {photos.length > 0 && (
            <Pressable
              style={styles.heroGalleryBtn}
              onPress={() => cycle(1)}
              hitSlop={12}
            >
              <Text style={styles.heroGalleryGlyph}>▤</Text>
            </Pressable>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, SERIF]}>{item.name}</Text>
        {(item.condition || item.acquired_date) && (
          <Text style={styles.metaLine}>
            {[item.condition, formatDate(item.acquired_date) === '—' ? null : `c. ${formatDate(item.acquired_date)}`]
              .filter(Boolean)
              .join('  •  ')}
          </Text>
        )}

        {/* Top action row */}
        <View style={styles.actionRow}>
          <ActionPill glyph="QR" label="Show QR" onPress={() =>
            router.push(`/(app)/inventory/${id}/item/${itemId}/qr`)
          } />
          {canEdit && (
            <ActionPill glyph="✎" label="Edit" onPress={() =>
              router.push(`/(app)/inventory/${id}/item/${itemId}/edit`)
            } />
          )}
          <ActionPill glyph="↗" label="Share" onPress={onShare} />
        </View>

        {/* Description */}
        {item.description ? (
          <SectionCard glyph="📄" title="Description">
            <Text style={styles.body}>{item.description}</Text>
          </SectionCard>
        ) : null}

        {/* Details */}
        <SectionCard glyph="≡" title="Details">
          <View style={styles.detailsGrid}>
            <DetailCell label="Condition" value={item.condition} />
            <DetailCell label="Location" value={item.location} />
            <DetailCell label="Acquired" value={formatDate(item.acquired_date)} />
            <DetailCell label="Value" value={formatMoney(item.value_amount, item.value_currency)} />
          </View>
        </SectionCard>

        {/* Category-specific details */}
        {cat && cat.fields.length > 0 && customEntries.length > 0 && (
          <SectionCard glyph={cat.glyph} title={`${cat.label} details`}>
            <View style={styles.detailsGrid}>
              {cat.fields.map((f) => {
                const v = (item.custom_fields as Record<string, unknown>)[f.key];
                if (v == null || v === '') return null;
                return <DetailCell key={f.key} label={f.label} value={String(v)} />;
              })}
            </View>
          </SectionCard>
        )}

        {/* Provenance */}
        {item.provenance ? (
          <SectionCard glyph="⛨" title="Provenance">
            <Text style={styles.body}>{item.provenance}</Text>
          </SectionCard>
        ) : null}

        {/* Notes */}
        {item.notes ? (
          <SectionCard glyph="✎" title="Notes">
            <Text style={styles.body}>{item.notes}</Text>
          </SectionCard>
        ) : null}

        {/* Intended Recipient */}
        {(item.intended_recipient_name || item.bequest_notes) && (
          <SectionCard glyph="👤" title="Intended recipient">
            {item.intended_recipient_name ? (
              <Text style={styles.recipName}>{item.intended_recipient_name}</Text>
            ) : null}
            {item.intended_recipient_contact ? (
              <Text style={styles.recipContact}>{item.intended_recipient_contact}</Text>
            ) : null}
            {item.bequest_notes ? (
              <Text style={[styles.body, styles.bequestQuote, SERIF]}>
                “{item.bequest_notes}”
              </Text>
            ) : null}
          </SectionCard>
        )}

        {/* Bottom action stack */}
        <View style={styles.bottomActions}>
          <View style={styles.bottomRow}>
            <Link
              href={`/(app)/inventory/${id}/item/${itemId}/history`}
              asChild
            >
              <Pressable style={styles.btnGhost}>
                <Text style={styles.btnGhostText}>↻ History</Text>
              </Pressable>
            </Link>
            <Pressable
              style={styles.btnPrimary}
              onPress={() =>
                router.push(`/(app)/inventory/${id}/item/${itemId}/qr`)
              }
            >
              <Text style={styles.btnPrimaryText}>QR code</Text>
            </Pressable>
          </View>
          {canEdit && (
            <Pressable
              style={styles.btnSecondary}
              onPress={() =>
                router.push(`/(app)/inventory/${id}/item/${itemId}/edit`)
              }
            >
              <Text style={styles.btnSecondaryText}>✎ Edit</Text>
            </Pressable>
          )}
          <Pressable style={styles.btnPreview} onPress={onPreview}>
            <Text style={styles.btnPreviewText}>Preview as executor</Text>
          </Pressable>
          {canDelete && (
            <Pressable style={styles.btnDanger} onPress={onDelete}>
              <Text style={styles.btnDangerText}>🗑  Delete item</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ActionPill({
  glyph,
  label,
  onPress,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.pill} onPress={onPress}>
      <View style={styles.pillIcon}>
        <Text style={styles.pillGlyph}>{glyph}</Text>
      </View>
      <Text style={styles.pillLabel}>{label}</Text>
    </Pressable>
  );
}

function SectionCard({
  glyph,
  title,
  children,
}: {
  glyph: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconGlyph}>{glyph}</Text>
        </View>
        <Text style={styles.cardTitle}>{title.toUpperCase()}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function DetailCell({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (value == null || value === '' || value === '—') {
    return (
      <View style={styles.detailCell}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, styles.detailMuted]}>—</Text>
      </View>
    );
  }
  return (
    <View style={styles.detailCell}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },

  crumb: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  crumbText: { color: colors.forest, fontWeight: '600' },
  crumbSep: { color: colors.muted },
  crumbCurrent: { color: colors.muted },

  hero: {
    position: 'relative',
    aspectRatio: 1.1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.creamSoft,
  },
  heroImage: { width: '100%', height: '100%' },
  heroEmpty: { alignItems: 'center', justifyContent: 'center' },
  heroEmptyGlyph: { fontSize: 64, color: colors.gold },
  heroChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  heroChipText: { color: colors.ink, fontWeight: '700', fontSize: 12 },
  heroCount: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroCountText: { color: 'white', fontWeight: '700', fontSize: 12 },
  heroValue: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: colors.forest,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  heroValueText: { color: colors.gold, fontWeight: '800', fontSize: 16 },
  heroGalleryBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGalleryGlyph: { color: colors.ink, fontSize: 18 },

  title: { fontSize: 30, fontWeight: '700', color: colors.ink, lineHeight: 36, marginTop: 8 },
  metaLine: { color: colors.muted, marginTop: 4 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  pill: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    ...shadows.card,
  },
  pillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillGlyph: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  pillLabel: { color: colors.ink, fontWeight: '600', fontSize: 13 },

  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    gap: 10,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconGlyph: { fontSize: 18 },
  cardTitle: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  cardBody: { gap: 8 },

  body: { color: colors.inkSoft, lineHeight: 22, fontSize: 14 },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailCell: { flexBasis: '46%', flexGrow: 1, gap: 2 },
  detailLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  detailValue: { color: colors.ink, fontSize: 14 },
  detailMuted: { color: colors.mutedSoft, fontStyle: 'italic' },

  recipName: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  recipContact: { color: colors.muted, fontSize: 13 },
  bequestQuote: { fontStyle: 'italic', color: colors.inkSoft, marginTop: 6 },

  bottomActions: { gap: 8, marginTop: 12 },
  bottomRow: { flexDirection: 'row', gap: 8 },
  btnGhost: {
    flex: 1,
    backgroundColor: colors.forest,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnGhostText: { color: colors.onForest, fontWeight: '700' },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.forest,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPrimaryText: { color: colors.onForest, fontWeight: '700' },
  btnSecondary: {
    backgroundColor: colors.creamSoft,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnSecondaryText: { color: colors.ink, fontWeight: '700' },
  btnPreview: {
    backgroundColor: colors.goldSoft,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPreviewText: { color: colors.goldDeep, fontWeight: '700' },
  btnDanger: {
    backgroundColor: colors.dangerSoft,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnDangerText: { color: colors.danger, fontWeight: '700' },
});
