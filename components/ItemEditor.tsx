import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  createCollection,
  deletePhoto,
  listMyCollectionsRich,
  listPhotos,
  photoPublicUrl,
  uploadPhoto,
  type CollectionWithStats,
} from '../lib/api';
import { CATEGORY_PRESETS, findCategory } from '../lib/categories';
import { confirm, notify } from '../lib/confirm';
import { formatMoney } from '../lib/format';
import { colors, radius, shadows } from '../lib/theme';
import type { Item, ItemPhoto } from '../lib/types';

const SERIF = { fontFamily: 'Georgia' };

export interface ItemEditorValues {
  name: string;
  collection: string | null;
  description: string;
  condition: string;
  location: string;
  value_amount: string;
  value_currency: string;
  acquired_date: string;
  notes: string;
  provenance: string;
  custom_fields: Record<string, string>;
  intended_recipient_name: string;
  intended_recipient_contact: string;
  bequest_notes: string;
  tagged_for_sale: boolean;
}

export const EMPTY_VALUES: ItemEditorValues = {
  name: '',
  collection: null,
  description: '',
  condition: '',
  location: '',
  value_amount: '',
  value_currency: 'USD',
  acquired_date: '',
  notes: '',
  provenance: '',
  custom_fields: {},
  intended_recipient_name: '',
  intended_recipient_contact: '',
  bequest_notes: '',
  tagged_for_sale: false,
};

export function itemToValues(it: Partial<Item>): ItemEditorValues {
  return {
    name: it.name ?? '',
    collection: it.category ?? null,
    description: it.description ?? '',
    condition: it.condition ?? '',
    location: it.location ?? '',
    value_amount: it.value_amount != null ? String(it.value_amount) : '',
    value_currency: it.value_currency ?? 'USD',
    acquired_date: it.acquired_date ?? '',
    notes: it.notes ?? '',
    provenance: it.provenance ?? '',
    custom_fields: Object.fromEntries(
      Object.entries((it.custom_fields ?? {}) as Record<string, unknown>).map(([k, v]) => [
        k,
        v == null ? '' : String(v),
      ]),
    ),
    intended_recipient_name: it.intended_recipient_name ?? '',
    intended_recipient_contact: it.intended_recipient_contact ?? '',
    bequest_notes: it.bequest_notes ?? '',
    tagged_for_sale: !!it.tagged_for_sale,
  };
}

export function valuesToDraft(v: ItemEditorValues) {
  const cleanCustom: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v.custom_fields)) {
    if (val !== '' && val != null) cleanCustom[k] = val;
  }
  return {
    name: v.name.trim(),
    category: v.collection,
    description: v.description.trim() || null,
    condition: v.condition.trim() || null,
    location: v.location.trim() || null,
    value_amount: v.value_amount.trim() ? Number(v.value_amount) : null,
    value_currency: v.value_currency.trim() || 'USD',
    notes: v.notes.trim() || null,
    provenance: v.provenance.trim() || null,
    acquired_date: v.acquired_date.trim() || null,
    intended_recipient_name: v.intended_recipient_name.trim() || null,
    intended_recipient_contact: v.intended_recipient_contact.trim() || null,
    bequest_notes: v.bequest_notes.trim() || null,
    custom_fields: cleanCustom,
    tagged_for_sale: v.tagged_for_sale,
  };
}

interface BufferedPhoto {
  uri: string;
  base64: string;
  mimeType: string;
}

interface Props {
  mode: 'new' | 'edit';
  inventoryId: string;
  itemId?: string | null;
  title: string;
  subtitle: string;
  initial: ItemEditorValues;
  onSave: (draft: ReturnType<typeof valuesToDraft>) => Promise<{ id: string }>;
  onDelete?: () => Promise<void>;
}

export default function ItemEditor({
  mode,
  inventoryId,
  itemId,
  title,
  subtitle,
  initial,
  onSave,
  onDelete,
}: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 800;
  const contentMaxWidth = width >= 1100 ? 960 : isTablet ? 760 : '100%';

  const [v, setV] = useState<ItemEditorValues>(initial);
  const [collections, setCollections] = useState<CollectionWithStats[]>([]);
  const [collDropdownOpen, setCollDropdownOpen] = useState(false);
  const [collSearch, setCollSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Photos
  const [buffered, setBuffered] = useState<BufferedPhoto[]>([]); // not yet uploaded
  const [existing, setExisting] = useState<ItemPhoto[]>([]); // already in DB (edit mode)

  useEffect(() => {
    listMyCollectionsRich().then(setCollections).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'edit' && itemId) {
      listPhotos(itemId).then(setExisting).catch(() => {});
    }
  }, [mode, itemId]);

  const update = useCallback(<K extends keyof ItemEditorValues>(k: K, val: ItemEditorValues[K]) => {
    setError(null);
    setV((p) => ({ ...p, [k]: val }));
  }, []);
  const updateCustom = useCallback((field: string, val: string) => {
    setV((p) => ({ ...p, custom_fields: { ...p.custom_fields, [field]: val } }));
  }, []);

  const preset = findCategory(v.collection);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    if (!a.base64) {
      notify('Could not read image');
      return;
    }
    if (mode === 'edit' && itemId) {
      // Live upload
      try {
        const p = await uploadPhoto({
          inventoryId,
          itemId,
          base64: a.base64,
          mimeType: a.mimeType ?? 'image/jpeg',
        });
        setExisting((arr) => [...arr, p]);
      } catch (e: any) {
        notify('Upload failed', e?.message ?? String(e));
      }
    } else {
      setBuffered((prev) => [
        ...prev,
        { uri: a.uri, base64: a.base64!, mimeType: a.mimeType ?? 'image/jpeg' },
      ]);
    }
  };

  const removeBuffered = (i: number) =>
    setBuffered((prev) => prev.filter((_, idx) => idx !== i));

  const removeExisting = async (p: ItemPhoto) => {
    if (!(await confirm('Delete this photo?'))) return;
    try {
      await deletePhoto(p);
      setExisting((arr) => arr.filter((x) => x.id !== p.id));
    } catch (e: any) {
      notify('Delete failed', e?.message ?? String(e));
    }
  };

  const save = async () => {
    if (!v.name.trim()) {
      setError('Item name is required.');
      return;
    }
    setSaving(true);
    try {
      const result = await onSave(valuesToDraft(v));
      // Upload any buffered photos (new mode only)
      for (const p of buffered) {
        try {
          await uploadPhoto({
            inventoryId,
            itemId: result.id,
            base64: p.base64,
            mimeType: p.mimeType,
          });
        } catch {}
      }
      router.replace(`/(app)/inventory/${inventoryId}/item/${result.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
      setSaving(false);
    }
  };

  const filteredCollections = useMemo(() => {
    const q = collSearch.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, collSearch]);

  const selectedColl = collections.find(
    (c) => c.name.toLowerCase() === (v.collection ?? '').toLowerCase(),
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollOuter}>
        <View
          style={[
            styles.container,
            { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backGlyph}>‹</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, SERIF]}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            {isTablet && (
              <Pressable
                style={[styles.btnPrimary, saving && { opacity: 0.6 }]}
                disabled={saving}
                onPress={save}
              >
                <Text style={styles.btnPrimaryText}>
                  {saving ? 'Saving…' : mode === 'new' ? 'Save item' : 'Save changes'}
                </Text>
              </Pressable>
            )}
          </View>

          {error ? (
            <View style={styles.errBox}>
              <Text style={styles.errText}>{error}</Text>
            </View>
          ) : null}

          {/* Basics */}
          <Section eyebrow="① BASICS" title="The essentials">
            <Field label="Name" required>
              <TextInput
                style={styles.input}
                value={v.name}
                onChangeText={(t) => update('name', t)}
                placeholder="e.g. Grandfather's walnut writing desk"
                placeholderTextColor={colors.mutedSoft}
              />
            </Field>

            <Field label="Collection" help="Choose an existing collection or create a new one.">
              <CollectionPicker
                selected={selectedColl ?? null}
                selectedName={v.collection}
                open={collDropdownOpen}
                setOpen={setCollDropdownOpen}
                items={filteredCollections}
                search={collSearch}
                setSearch={setCollSearch}
                onPick={(name) => {
                  update('collection', name);
                  setCollDropdownOpen(false);
                }}
                onClear={() => update('collection', null)}
                onCreateNew={async (name) => {
                  try {
                    await createCollection(name, null);
                    update('collection', name);
                    setCollDropdownOpen(false);
                    listMyCollectionsRich().then(setCollections).catch(() => {});
                  } catch (e: any) {
                    notify('Could not create', e?.message ?? String(e));
                  }
                }}
              />
            </Field>

            <Field label="Description">
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                value={v.description}
                onChangeText={(t) => update('description', t)}
                multiline
                placeholder="Brief description of the item, its significance, or any key details."
                placeholderTextColor={colors.mutedSoft}
              />
            </Field>

            <Row twoCol={isTablet}>
              <Field label="Condition">
                <TextInput
                  style={styles.input}
                  value={v.condition}
                  onChangeText={(t) => update('condition', t)}
                  placeholder="e.g. Excellent"
                  placeholderTextColor={colors.mutedSoft}
                />
              </Field>
              <Field label="Location">
                <TextInput
                  style={styles.input}
                  value={v.location}
                  onChangeText={(t) => update('location', t)}
                  placeholder="e.g. Living room"
                  placeholderTextColor={colors.mutedSoft}
                />
              </Field>
            </Row>

            <Row twoCol={isTablet}>
              <Field label="Value">
                <TextInput
                  style={styles.input}
                  value={v.value_amount}
                  onChangeText={(t) => update('value_amount', t)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedSoft}
                />
              </Field>
              <Field label="Currency">
                <TextInput
                  style={styles.input}
                  value={v.value_currency}
                  onChangeText={(t) => update('value_currency', t.toUpperCase())}
                  placeholder="USD"
                  autoCapitalize="characters"
                  maxLength={3}
                  placeholderTextColor={colors.mutedSoft}
                />
              </Field>
            </Row>

            <Field label="Acquired date" help="When did this come into your possession?">
              <TextInput
                style={styles.input}
                value={v.acquired_date}
                onChangeText={(t) => update('acquired_date', t)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedSoft}
              />
            </Field>

            <Field label="Notes (optional)" help="Any extra notes about this item.">
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                value={v.notes}
                onChangeText={(t) => update('notes', t)}
                multiline
                placeholder="Add any extra notes here…"
                placeholderTextColor={colors.mutedSoft}
              />
            </Field>

            <Pressable
              style={styles.toggleRow}
              onPress={() => update('tagged_for_sale', !v.tagged_for_sale)}
            >
              <View
                style={[
                  styles.toggleBox,
                  v.tagged_for_sale && styles.toggleBoxOn,
                ]}
              >
                {v.tagged_for_sale ? <Text style={styles.toggleCheck}>✓</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Tagged for sale</Text>
                <Text style={styles.toggleHelp}>
                  Show this item in the "Items tagged for sale" tally on the home screen.
                </Text>
              </View>
            </Pressable>
          </Section>

          {/* Photos */}
          <Section eyebrow="② PHOTOS" title="Add images">
            <Text style={styles.body}>
              Long-press a thumbnail (or tap ×) to remove it.{' '}
              {mode === 'edit'
                ? 'Adds & removes here are immediate.'
                : 'Photos upload when you save.'}
            </Text>
            <View style={styles.photoGrid}>
              {existing.map((p) => (
                <View key={p.id} style={styles.photoCell}>
                  <Image
                    source={{ uri: photoPublicUrl(p.storage_path) }}
                    style={styles.photoImg}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={styles.photoRemove}
                    onPress={() => removeExisting(p)}
                  >
                    <Text style={styles.photoRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
              {buffered.map((p, i) => (
                <View key={`buf-${i}`} style={styles.photoCell}>
                  <Image source={{ uri: p.uri }} style={styles.photoImg} />
                  <View style={styles.photoBadge}>
                    <Text style={styles.photoBadgeText}>NEW</Text>
                  </View>
                  <Pressable
                    style={styles.photoRemove}
                    onPress={() => removeBuffered(i)}
                  >
                    <Text style={styles.photoRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable style={[styles.photoCell, styles.photoAdd]} onPress={pickPhoto}>
                <Text style={styles.photoAddPlus}>+</Text>
                <Text style={styles.photoAddText}>Add photo</Text>
              </Pressable>
            </View>
          </Section>

          {/* Details */}
          <Section
            eyebrow="③ DETAILS"
            title={preset ? `${preset.label} details` : 'Collection details'}
          >
            {!preset ? (
              <Text style={styles.body}>
                Pick a collection in Basics to see category-specific fields here.
              </Text>
            ) : preset.fields.length === 0 ? (
              <Text style={styles.body}>
                No extra fields for the “{preset.label}” collection.
              </Text>
            ) : (
              <Row twoCol={isTablet}>
                {preset.fields.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <TextInput
                      style={styles.input}
                      value={v.custom_fields[f.key] ?? ''}
                      onChangeText={(t) => updateCustom(f.key, t)}
                      keyboardType={f.type === 'number' ? 'numeric' : 'default'}
                      placeholderTextColor={colors.mutedSoft}
                    />
                  </Field>
                ))}
              </Row>
            )}
          </Section>

          {/* Provenance */}
          <Section eyebrow="④ PROVENANCE" title="History & origin">
            <Field
              label="Where did it come from?"
              help="Family, an estate, a particular shop — anything worth remembering."
            >
              <TextInput
                style={[styles.input, { minHeight: 120 }]}
                value={v.provenance}
                onChangeText={(t) => update('provenance', t)}
                multiline
                placeholder="Passed down from grandma Rose; originally from her parents' house in Chicago."
                placeholderTextColor={colors.mutedSoft}
              />
            </Field>
          </Section>

          {/* Recipient */}
          <Section eyebrow="⑤ RECIPIENT" title="Who it's for">
            <Field
              label="Intended recipient"
              help="Your wishes for who should inherit this item. Informational only — not a legal will."
            >
              <TextInput
                style={styles.input}
                value={v.intended_recipient_name}
                onChangeText={(t) => update('intended_recipient_name', t)}
                placeholder="My niece Sara"
                placeholderTextColor={colors.mutedSoft}
              />
            </Field>
            <Field label="How to reach them">
              <TextInput
                style={styles.input}
                value={v.intended_recipient_contact}
                onChangeText={(t) => update('intended_recipient_contact', t)}
                placeholder="Email, phone, or relationship"
                placeholderTextColor={colors.mutedSoft}
              />
            </Field>
            <Field label="Bequest notes">
              <TextInput
                style={[styles.input, { minHeight: 100 }]}
                value={v.bequest_notes}
                onChangeText={(t) => update('bequest_notes', t)}
                multiline
                placeholder="Why this person, special instructions, anything they should know."
                placeholderTextColor={colors.mutedSoft}
              />
            </Field>
          </Section>

          {/* Danger zone — edit only */}
          {mode === 'edit' && onDelete && (
            <Section eyebrow="⑥ DANGER ZONE" title="Delete this item">
              <Text style={styles.body}>
                Permanently delete this item, its photos, and its revision history.
                This cannot be undone.
              </Text>
              <Pressable
                style={styles.btnDanger}
                onPress={async () => {
                  if (!(await confirm('Delete this item?', 'This cannot be undone.'))) return;
                  try {
                    await onDelete();
                    router.replace(`/(app)/inventory/${inventoryId}`);
                  } catch (e: any) {
                    notify('Delete failed', e?.message ?? String(e));
                  }
                }}
              >
                <Text style={styles.btnDangerText}>Delete item</Text>
              </Pressable>
            </Section>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.bottomBar}>
        <View
          style={[
            styles.bottomInner,
            { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' },
          ]}
        >
          <Pressable style={styles.btnCancel} onPress={() => router.back()}>
            <Text style={styles.btnCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.btnPrimary, { flex: 1 }, saving && { opacity: 0.6 }]}
            disabled={saving}
            onPress={save}
          >
            {saving ? (
              <ActivityIndicator color={colors.onForest} />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {mode === 'new' ? 'Save item' : 'Save changes'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// =========================================================================
// Sub-components
// =========================================================================

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={[styles.sectionTitle, SERIF]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({
  label,
  help,
  required,
  children,
}: {
  label: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      {help ? <Text style={styles.fieldHelp}>{help}</Text> : null}
      {children}
    </View>
  );
}

function Row({ twoCol, children }: { twoCol: boolean; children: React.ReactNode }) {
  if (twoCol) return <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>;
  return <View style={{ gap: 14 }}>{children}</View>;
}

function CollectionPicker({
  selected,
  selectedName,
  open,
  setOpen,
  items,
  search,
  setSearch,
  onPick,
  onClear,
  onCreateNew,
}: {
  selected: CollectionWithStats | null;
  selectedName: string | null;
  open: boolean;
  setOpen: (b: boolean) => void;
  items: CollectionWithStats[];
  search: string;
  setSearch: (s: string) => void;
  onPick: (name: string) => void;
  onClear: () => void;
  onCreateNew: (name: string) => void;
}) {
  const preset = findCategory(selectedName);
  const displayLabel = preset?.label ?? selected?.name ?? selectedName ?? 'Select a collection';
  return (
    <View>
      <Pressable style={styles.dropdownTrigger} onPress={() => setOpen(!open)}>
        {selectedName ? (
          <View style={styles.selectedRow}>
            <View style={styles.miniIcon}>
              {preset?.iconAsset ? (
                <Image source={preset.iconAsset} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              ) : (
                <Text style={styles.miniIconGlyph}>◇</Text>
              )}
            </View>
            <Text style={styles.dropdownSelected}>{displayLabel}</Text>
            <Pressable hitSlop={8} onPress={onClear}>
              <Text style={styles.dropdownClear}>✕</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.dropdownPlaceholder}>{displayLabel}</Text>
        )}
        <Text style={styles.dropdownChevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open && (
        <View style={styles.dropdownPanel}>
          <View style={styles.searchRow}>
            <Text style={styles.searchGlyph}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search collections"
              placeholderTextColor={colors.mutedSoft}
              autoCapitalize="none"
            />
          </View>
          <ScrollView style={{ maxHeight: 320 }}>
            {items.map((c) => {
              const cPreset = findCategory(c.name);
              const isSelected = (selectedName ?? '').toLowerCase() === c.name.toLowerCase();
              return (
                <Pressable
                  key={c.name}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={() => onPick(c.name)}
                >
                  <View style={styles.miniIcon}>
                    {cPreset?.iconAsset ? (
                      <Image source={cPreset.iconAsset} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                    ) : (
                      <Text style={styles.miniIconGlyph}>◇</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{cPreset?.label ?? c.name}</Text>
                    <Text style={styles.optionMeta}>
                      {c.itemCount} item{c.itemCount === 1 ? '' : 's'}
                      {c.totalValue > 0 ? ` • ${formatMoney(c.totalValue, c.currency)}` : ''}
                    </Text>
                  </View>
                  {isSelected ? <Text style={styles.optionCheck}>✓</Text> : null}
                </Pressable>
              );
            })}

            {search.trim() && !items.some(
              (c) => c.name.toLowerCase() === search.trim().toLowerCase(),
            ) ? (
              <Pressable
                style={[styles.optionRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}
                onPress={() => onCreateNew(search.trim())}
              >
                <View style={[styles.miniIcon, { backgroundColor: colors.goldSoft }]}>
                  <Text style={[styles.miniIconGlyph, { color: colors.goldDeep }]}>+</Text>
                </View>
                <Text style={[styles.optionTitle, { color: colors.gold }]}>
                  + Create collection “{search.trim()}”
                </Text>
              </Pressable>
            ) : null}

            {!search.trim() && (
              <>
                <Text style={styles.optionSection}>SUGGESTIONS</Text>
                {CATEGORY_PRESETS.filter(
                  (p) => !p.custom && !items.some((c) => c.name.toLowerCase() === p.label.toLowerCase()),
                )
                  .slice(0, 8)
                  .map((p) => (
                    <Pressable key={p.key} style={styles.optionRow} onPress={() => onPick(p.label)}>
                      <View style={styles.miniIcon}>
                        {p.iconAsset ? (
                          <Image source={p.iconAsset} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                        ) : (
                          <Text style={styles.miniIconGlyph}>{p.glyph}</Text>
                        )}
                      </View>
                      <Text style={styles.optionTitle}>{p.label}</Text>
                    </Pressable>
                  ))}
              </>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollOuter: { paddingBottom: 100 },
  container: { padding: 16, gap: 16 },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  backGlyph: { fontSize: 22, color: colors.ink, fontWeight: '700', marginTop: -2 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink, lineHeight: 30 },
  subtitle: { color: colors.muted, marginTop: 2 },

  btnPrimary: {
    backgroundColor: colors.forest, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { color: colors.onForest, fontWeight: '700' },
  btnCancel: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.md },
  btnCancelText: { color: colors.muted, fontWeight: '700' },
  btnDanger: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  btnDangerText: { color: colors.danger, fontWeight: '600', fontSize: 13 },

  errBox: {
    backgroundColor: colors.dangerSoft, borderColor: colors.danger, borderWidth: 1,
    borderRadius: radius.md, padding: 10,
  },
  errText: { color: colors.danger, fontWeight: '600' },

  section: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    ...shadows.card,
  },
  sectionHeader: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
    backgroundColor: colors.creamSoft,
  },
  sectionEyebrow: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  sectionTitle: { fontSize: 20, color: colors.ink, fontWeight: '700', marginTop: 2 },
  sectionBody: { padding: 16, gap: 14 },

  body: { color: colors.inkSoft, lineHeight: 22 },

  fieldLabel: { color: colors.inkSoft, fontWeight: '700', fontSize: 14 },
  fieldHelp: { color: colors.muted, fontSize: 12 },
  req: { color: colors.danger },

  input: {
    borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 16,
    backgroundColor: colors.cream, color: colors.ink,
  },

  toggleRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.cream, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.hairline,
  },
  toggleBox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleBoxOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  toggleCheck: { color: colors.gold, fontWeight: '700' },
  toggleLabel: { color: colors.ink, fontWeight: '700' },
  toggleHelp: { color: colors.muted, fontSize: 12, marginTop: 2 },

  // Collection dropdown
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.hairline,
    borderRadius: radius.md, backgroundColor: colors.cream,
    paddingHorizontal: 12, paddingVertical: 10, minHeight: 48,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  miniIcon: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: colors.creamSoft,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  miniIconGlyph: { color: colors.forest, fontWeight: '700' },
  dropdownPlaceholder: { color: colors.mutedSoft, flex: 1, fontSize: 16 },
  dropdownSelected: { color: colors.ink, flex: 1, fontWeight: '600', fontSize: 16 },
  dropdownClear: { color: colors.muted, fontSize: 14, paddingHorizontal: 4 },
  dropdownChevron: { color: colors.muted },
  dropdownPanel: {
    marginTop: 6, backgroundColor: colors.paper,
    borderWidth: 1, borderColor: colors.hairline,
    borderRadius: radius.md, overflow: 'hidden',
    ...shadows.raised,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 10, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  searchGlyph: { color: colors.muted },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink, padding: 0 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  optionRowSelected: { backgroundColor: colors.creamSoft },
  optionTitle: { color: colors.ink, fontWeight: '600' },
  optionMeta: { color: colors.muted, fontSize: 12 },
  optionCheck: { color: colors.forest, fontWeight: '700' },
  optionSection: {
    paddingHorizontal: 12, paddingTop: 14, paddingBottom: 4,
    color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
  },

  // Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoCell: {
    width: 110, height: 110, borderRadius: 10, overflow: 'hidden',
    backgroundColor: colors.creamSoft, position: 'relative',
  },
  photoImg: { width: '100%', height: '100%' },
  photoBadge: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: colors.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  photoBadgeText: { color: 'white', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  photoRemove: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: 'white', fontWeight: '700' },
  photoAdd: {
    borderWidth: 1.5, borderColor: colors.gold, borderStyle: 'dashed',
    backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  photoAddPlus: { color: colors.forest, fontSize: 24, fontWeight: '700' },
  photoAddText: { color: colors.muted, fontSize: 12 },

  bottomBar: {
    backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.hairline,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14,
    ...shadows.raised,
  },
  bottomInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
