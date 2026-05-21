import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createCollection,
  listAllCollectionNames,
  listMyInventories,
  photoPublicUrl,
  reassignAndDeleteCollection,
} from '../../../lib/api';
import { findCategory, labelForCategory } from '../../../lib/categories';
import { confirm, notify } from '../../../lib/confirm';
import { formatMoney } from '../../../lib/format';
import { supabase } from '../../../lib/supabase';
import { colors, radius, shadows } from '../../../lib/theme';
import type { Inventory, Item, InventoryWithRole } from '../../../lib/types';

const SERIF = { fontFamily: 'Georgia' };

interface CollectionRow {
  id: string | null;
  name: string;
  description: string | null;
  hero_storage_path: string | null;
}

interface ItemWithExtras extends Item {
  inventory_name: string | null;
  first_photo_path: string | null;
}

interface Stats {
  itemCount: number;
  totalValue: number;
  currency: string;
  recipientCount: number;
  oldestLabel: string;
}

type SortKey = 'recent' | 'name' | 'value';

export default function CollectionDetail() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const [coll, setColl] = useState<CollectionRow | null>(null);
  const [items, setItems] = useState<ItemWithExtras[]>([]);
  const [inventories, setInventories] = useState<InventoryWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('recent');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [showDeletePicker, setShowDeletePicker] = useState(false);
  const [otherNames, setOtherNames] = useState<string[]>([]);

  const isUnassigned = key === '__uncategorized';

  const load = useCallback(async () => {
    if (!key) return;
    try {
      // 1) Pre-created collection record (may not exist for ad-hoc tags, never for unassigned)
      const { data: collRow } = isUnassigned
        ? { data: null }
        : await supabase
            .from('collections')
            .select('id, name, description, hero_storage_path')
            .ilike('name', key)
            .maybeSingle();

      // 2) Items + their inventory + first photo
      const baseSelect = 'id, inventory_id, name, category, description, condition, location, value_amount, value_currency, notes, provenance, acquired_date, intended_recipient_name, intended_recipient_contact, bequest_notes, custom_fields, public_id, tagged_for_sale, conservator_id, created_by, created_at, updated_at, item_photos(storage_path, sort_order), inventory:inventories(name)';
      const { data: rawItems } = isUnassigned
        ? await supabase.from('items').select(baseSelect).is('category', null)
        : await supabase.from('items').select(baseSelect).ilike('category', key);

      const flat: ItemWithExtras[] = ((rawItems ?? []) as unknown as Array<
        Item & {
          item_photos: { storage_path: string; sort_order: number }[] | null;
          inventory: { name: string } | { name: string }[] | null;
        }
      >).map((r) => {
        const inv = Array.isArray(r.inventory) ? r.inventory[0] : r.inventory;
        const photo = (r.item_photos ?? []).slice().sort(
          (a, b) => a.sort_order - b.sort_order,
        )[0];
        return {
          ...(r as Item),
          inventory_name: inv?.name ?? null,
          first_photo_path: photo?.storage_path ?? null,
        };
      });

      setColl(
        collRow ?? {
          id: null,
          name: isUnassigned ? 'Unassigned' : (labelForCategory(key) || key),
          description: null,
          hero_storage_path: null,
        },
      );
      setDescDraft(collRow?.description ?? '');
      setItems(flat);

      const invs = await listMyInventories();
      setInventories(invs);
    } finally {
      setLoading(false);
    }
  }, [key, isUnassigned]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const stats = useMemo<Stats>(() => {
    let total = 0;
    let currency = 'USD';
    const recipients = new Set<string>();
    let oldestYear: number | null = null;
    for (const it of items) {
      if (it.value_amount != null) {
        total += Number(it.value_amount);
        currency = it.value_currency || currency;
      }
      if (it.intended_recipient_name) recipients.add(it.intended_recipient_name);
      if (it.acquired_date) {
        const y = parseInt(it.acquired_date.slice(0, 4), 10);
        if (!Number.isNaN(y) && (oldestYear == null || y < oldestYear)) oldestYear = y;
      }
    }
    let oldestLabel = '—';
    if (oldestYear != null) {
      const decade = Math.floor(oldestYear / 10) * 10;
      oldestLabel = `${decade}s`;
    }
    return {
      itemCount: items.length,
      totalValue: total,
      currency,
      recipientCount: recipients.size,
      oldestLabel,
    };
  }, [items]);

  const sortedItems = useMemo(() => {
    const arr = [...items];
    switch (sort) {
      case 'name':
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'value':
        arr.sort((a, b) => (b.value_amount ?? 0) - (a.value_amount ?? 0));
        break;
      case 'recent':
      default:
        arr.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        break;
    }
    return arr;
  }, [items, sort]);

  if (loading || !coll) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  const preset = findCategory(coll.name);
  const displayName = preset?.label ?? coll.name;
  const heroFromIcon = preset?.iconAsset ?? null;
  const heroFromPhoto =
    items.find((i) => i.first_photo_path)?.first_photo_path ?? coll.hero_storage_path ?? null;

  const saveDescription = async () => {
    try {
      if (coll.id) {
        await supabase
          .from('collections')
          .update({ description: descDraft.trim() || null })
          .eq('id', coll.id);
      } else {
        // ad-hoc: create the collection row now
        const created = await createCollection(coll.name, descDraft.trim() || null);
        setColl({
          id: created.id,
          name: created.name,
          description: created.description,
          hero_storage_path: null,
        });
      }
      setEditingDesc(false);
      await load();
    } catch (e: any) {
      notify('Could not save', e?.message ?? String(e));
    }
  };

  const openDeletePicker = async () => {
    if (isUnassigned) {
      notify('Can\'t delete', 'The Unassigned bucket is automatic — it lists items that don\'t have a collection yet.');
      return;
    }
    const ok = await confirm(
      `Delete "${coll.name}"?`,
      `You'll be asked where the ${stats.itemCount} item${stats.itemCount === 1 ? '' : 's'} should go next.`,
    );
    if (!ok) return;
    const all = await listAllCollectionNames();
    setOtherNames(all.filter((n) => n.toLowerCase() !== coll.name.toLowerCase()));
    setShowDeletePicker(true);
  };

  const onReassignTo = async (target: string | null) => {
    const targetLabel = target ?? 'No collection (unassigned)';
    const ok = await confirm(
      `Delete "${coll.name}"?`,
      `All ${stats.itemCount} item${stats.itemCount === 1 ? '' : 's'} will be moved to "${targetLabel}", then this collection will be deleted. Cannot be undone.`,
    );
    if (!ok) return;
    try {
      await reassignAndDeleteCollection({ fromName: coll.name, toName: target });
      router.replace('/(app)/collections');
    } catch (e: any) {
      notify('Could not delete', e?.message ?? String(e));
    }
  };

  const onAddItem = () => {
    const writableInv = inventories.find(
      (i) => i.role === 'owner' || i.role === 'contributor',
    );
    if (!writableInv) {
      notify(
        'No writable inventory',
        'Create an inventory first, then add items to this collection.',
      );
      return;
    }
    router.push({
      pathname: '/(app)/inventory/[id]/item/new',
      params: { id: writableInv.id, category: coll.name },
    });
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={styles.scroll}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.push('/(app)/collections')}
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.crumb}>Collections</Text>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.headerAction} hitSlop={8}>
          <Text style={styles.headerActionGlyph}>↗</Text>
        </Pressable>
        <Pressable
          style={styles.headerAction}
          hitSlop={8}
          onPress={() => setEditingDesc(true)}
        >
          <Text style={styles.headerActionGlyph}>✎</Text>
        </Pressable>
        <Pressable style={styles.headerAction} hitSlop={8}>
          <Text style={styles.headerActionGlyph}>⋯</Text>
        </Pressable>
      </View>

      {/* Hero + summary side-by-side */}
      <View style={styles.heroBlock}>
        <View style={styles.heroImageWrap}>
          {heroFromPhoto ? (
            <Image
              source={{ uri: photoPublicUrl(heroFromPhoto) }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : heroFromIcon ? (
            <Image source={heroFromIcon} style={styles.heroImage} resizeMode="contain" />
          ) : (
            <View style={[styles.heroImage, styles.heroEmpty]}>
              <Text style={styles.heroEmptyGlyph}>{preset?.glyph ?? '◇'}</Text>
            </View>
          )}
        </View>
        <View style={styles.summaryBlock}>
          <Text style={[styles.title, SERIF]}>{displayName}</Text>
          <Text style={styles.subtitle}>
            {stats.itemCount} item{stats.itemCount === 1 ? '' : 's'} across your
            inventories
          </Text>

          <View style={styles.statsRow}>
            <StatCol glyph="▢" value={String(stats.itemCount)} label="Items" />
            <View style={styles.statDiv} />
            <StatCol
              glyph="◊"
              value={formatMoney(stats.totalValue, stats.currency)}
              label="Est. value"
            />
            <View style={styles.statDiv} />
            <StatCol
              glyph="◯"
              value={String(stats.recipientCount)}
              label="Recipients"
            />
            <View style={styles.statDiv} />
            <StatCol glyph="◰" value={stats.oldestLabel} label="Oldest item" />
          </View>
        </View>
      </View>

      {/* About card */}
      <View style={styles.aboutCard}>
        <View style={styles.aboutIcon}>
          <Text style={styles.aboutGlyph}>◇</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aboutLabel}>ABOUT THIS COLLECTION</Text>
          {editingDesc ? (
            <>
              <TextInput
                style={styles.aboutInput}
                value={descDraft}
                onChangeText={setDescDraft}
                multiline
                placeholder="What lives in this collection?"
                placeholderTextColor={colors.mutedSoft}
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable style={styles.savePill} onPress={saveDescription}>
                  <Text style={styles.savePillText}>Save</Text>
                </Pressable>
                <Pressable
                  style={styles.cancelPill}
                  onPress={() => {
                    setEditingDesc(false);
                    setDescDraft(coll.description ?? '');
                  }}
                >
                  <Text style={styles.cancelPillText}>Cancel</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.aboutBody}>
              {coll.description?.trim() ||
                'Add a description so future generations know what this collection means.'}
            </Text>
          )}
        </View>
        {!editingDesc && (
          <Pressable onPress={() => setEditingDesc(true)} hitSlop={8}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        )}
      </View>

      {/* Items header */}
      <View style={styles.itemsHeader}>
        <Text style={styles.itemsTitle}>ITEMS ({stats.itemCount})</Text>
        <Pressable
          style={styles.sortPill}
          onPress={() => {
            setSort((s) =>
              s === 'recent' ? 'name' : s === 'name' ? 'value' : 'recent',
            );
          }}
        >
          <Text style={styles.sortText}>
            Sort: {sort === 'recent' ? 'Recently added' : sort === 'name' ? 'Name A–Z' : 'Value'}
          </Text>
          <Text style={styles.sortGlyph}>⌄</Text>
        </Pressable>
      </View>

      {/* Items list */}
      {sortedItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No items in this collection yet.
          </Text>
        </View>
      ) : (
        sortedItems.map((it) => (
          <Link
            key={it.id}
            href={`/(app)/inventory/${it.inventory_id}/item/${it.id}`}
            asChild
          >
            <Pressable style={styles.itemCard}>
              <View style={styles.itemThumb}>
                {it.first_photo_path ? (
                  <Image
                    source={{ uri: photoPublicUrl(it.first_photo_path) }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.itemThumbGlyph}>{preset?.glyph ?? '◇'}</Text>
                )}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.itemName, SERIF]} numberOfLines={2}>
                  {it.name}
                </Text>
                {(it.condition || it.acquired_date) && (
                  <Text style={styles.itemSub}>
                    {[it.condition, it.acquired_date ? `c. ${it.acquired_date.slice(0, 4)}` : null]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                )}
                <View style={styles.chipRow}>
                  {it.inventory_name && (
                    <View style={styles.invChip}>
                      <Text style={styles.invChipText}>{it.inventory_name}</Text>
                    </View>
                  )}
                  {it.intended_recipient_name ? (
                    <Text style={styles.forText}>
                      • for {it.intended_recipient_name}
                    </Text>
                  ) : null}
                </View>
                {(it.location || it.custom_fields) && (
                  <View style={styles.detailMini}>
                    {it.location ? (
                      <>
                        <Text style={styles.detailMiniGlyph}>▢</Text>
                        <Text style={styles.detailMiniText}>{it.location}</Text>
                      </>
                    ) : null}
                  </View>
                )}
              </View>
              <View style={styles.itemValueCol}>
                <View style={styles.itemValueBadge}>
                  <Text style={styles.itemValueText}>
                    {formatMoney(it.value_amount, it.value_currency)}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          </Link>
        ))
      )}

      {/* Add item tile */}
      <Pressable style={styles.addTile} onPress={onAddItem}>
        <View style={styles.addCircle}>
          <Text style={styles.addPlus}>+</Text>
        </View>
        <Text style={styles.addText}>
          {isUnassigned ? 'Add item' : 'Add item to this collection'}
        </Text>
      </Pressable>

      {/* Danger zone */}
      {!isUnassigned && (
        <View style={{ marginTop: 24, gap: 10 }}>
          {!showDeletePicker ? (
            <Pressable style={styles.deleteBtn} onPress={openDeletePicker}>
              <Text style={styles.deleteBtnText}>Delete this collection</Text>
            </Pressable>
          ) : (
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>
                Move {stats.itemCount} item{stats.itemCount === 1 ? '' : 's'} to:
              </Text>
              <Text style={styles.pickerHelp}>
                Pick where the items in “{coll.name}” should go. Then the
                collection itself will be deleted.
              </Text>
              <Pressable
                style={styles.pickerRow}
                onPress={() => onReassignTo(null)}
              >
                <View style={styles.pickerDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerRowTitle}>No collection</Text>
                  <Text style={styles.pickerRowMeta}>
                    Items become Unassigned — you can sort them later.
                  </Text>
                </View>
              </Pressable>
              {otherNames.map((n) => (
                <Pressable
                  key={n}
                  style={styles.pickerRow}
                  onPress={() => onReassignTo(n)}
                >
                  <View style={[styles.pickerDot, styles.pickerDotFilled]} />
                  <Text style={styles.pickerRowTitle}>
                    {findCategory(n)?.label ?? n}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={styles.pickerCancel}
                onPress={() => setShowDeletePicker(false)}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function StatCol({ glyph, value, label }: { glyph: string; value: string; label: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statGlyph}>{glyph}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
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
  backGlyph: { fontSize: 22, color: colors.ink, marginTop: -2, fontWeight: '700' },
  crumb: { fontSize: 18, color: colors.ink, fontWeight: '700' },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionGlyph: { color: colors.ink, fontSize: 16 },

  heroBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroImageWrap: {
    width: 160,
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  heroImage: { width: '100%', height: '100%' },
  heroEmpty: { backgroundColor: colors.creamSoft, alignItems: 'center', justifyContent: 'center' },
  heroEmptyGlyph: { fontSize: 56, color: colors.gold },

  summaryBlock: { flex: 1, gap: 4 },
  title: { fontSize: 34, color: colors.ink, fontWeight: '700', lineHeight: 38 },
  subtitle: { color: colors.muted, marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginTop: 14,
    alignItems: 'stretch',
  },
  statCol: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 2 },
  statDiv: { width: 1, backgroundColor: colors.hairline, marginVertical: 4 },
  statGlyph: { color: colors.forest, fontSize: 18, fontWeight: '700' },
  statValue: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  statLabel: { color: colors.muted, fontSize: 10 },

  aboutCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    ...shadows.card,
  },
  aboutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutGlyph: { fontSize: 20, color: colors.forest },
  aboutLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  aboutBody: { color: colors.ink, lineHeight: 20 },
  aboutInput: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: 10,
    backgroundColor: colors.cream,
    minHeight: 70,
    color: colors.ink,
  },
  editLink: { color: colors.gold, fontWeight: '700', marginTop: 4 },
  savePill: {
    backgroundColor: colors.forest,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  savePillText: { color: colors.onForest, fontWeight: '700' },
  cancelPill: {
    backgroundColor: colors.creamSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelPillText: { color: colors.ink, fontWeight: '600' },

  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.muted,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sortText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  sortGlyph: { color: colors.muted },

  empty: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 18,
  },
  emptyText: { color: colors.muted },

  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    ...shadows.card,
  },
  itemThumb: {
    width: 120,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemThumbGlyph: { fontSize: 36, color: colors.gold },
  itemName: { fontSize: 18, fontWeight: '700', color: colors.ink, paddingTop: 12, paddingRight: 12 },
  itemSub: { color: colors.muted, fontSize: 13 },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  invChip: {
    backgroundColor: '#DCEBE0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  invChipText: { color: '#3E7A5C', fontSize: 11, fontWeight: '700' },
  forText: { color: colors.muted, fontSize: 12 },
  detailMini: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  detailMiniGlyph: { color: colors.forest, fontSize: 13 },
  detailMiniText: { color: colors.muted, fontSize: 12 },
  itemValueCol: {
    paddingRight: 12,
    paddingVertical: 12,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemValueBadge: {
    backgroundColor: colors.creamSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemValueText: { color: colors.ink, fontWeight: '700' },
  chevron: { color: colors.mutedSoft, fontSize: 22 },

  addTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: 22,
    marginTop: 8,
  },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: { color: colors.forest, fontSize: 24, fontWeight: '700' },
  addText: { color: colors.ink, fontWeight: '700' },

  deleteBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  deleteBtnText: { color: colors.danger, fontWeight: '600', fontSize: 13 },

  pickerCard: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
    ...shadows.card,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  pickerHelp: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  pickerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  pickerDotFilled: { backgroundColor: colors.gold },
  pickerRowTitle: { color: colors.ink, fontWeight: '600' },
  pickerRowMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pickerCancel: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerCancelText: { color: colors.muted, fontWeight: '600' },
});
