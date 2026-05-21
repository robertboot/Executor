import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
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
  createItem,
  listMyCollectionsRich,
  photoPublicUrl,
  uploadPhoto,
  type CollectionWithStats,
} from '../../../../../lib/api';
import { CATEGORY_PRESETS, findCategory, labelForCategory } from '../../../../../lib/categories';
import { notify } from '../../../../../lib/confirm';
import { formatMoney } from '../../../../../lib/format';
import { colors, radius, shadows } from '../../../../../lib/theme';

const SERIF = { fontFamily: 'Georgia' };

const STEPS = [
  { key: 'basics', title: 'Basics', sub: 'Essential details' },
  { key: 'photos', title: 'Photos', sub: 'Add images' },
  { key: 'details', title: 'Details', sub: 'Physical & monetary' },
  { key: 'provenance', title: 'Provenance', sub: 'History & origin' },
  { key: 'recipient', title: 'Recipient', sub: "Who it's for" },
  { key: 'review', title: 'Review', sub: 'Review & save' },
] as const;
type StepKey = (typeof STEPS)[number]['key'];

interface FormValues {
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
}

interface BufferedPhoto {
  uri: string; // local uri for preview
  base64: string;
  mimeType: string;
}

const EMPTY: FormValues = {
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
};

export default function NewItem() {
  const { id, category } = useLocalSearchParams<{ id: string; category?: string }>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 800;
  const contentMaxWidth = width >= 1100 ? 960 : isTablet ? 760 : '100%';

  const [step, setStep] = useState<StepKey>('basics');
  const [v, setV] = useState<FormValues>({ ...EMPTY, collection: category ?? null });
  const [photos, setPhotos] = useState<BufferedPhoto[]>([]);
  const [collections, setCollections] = useState<CollectionWithStats[]>([]);
  const [collDropdownOpen, setCollDropdownOpen] = useState(false);
  const [collSearch, setCollSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<'item' | 'draft' | null>(null);

  useEffect(() => {
    listMyCollectionsRich().then(setCollections).catch(() => {});
  }, []);

  const update = useCallback(<K extends keyof FormValues>(k: K, val: FormValues[K]) => {
    setError(null);
    setV((p) => ({ ...p, [k]: val }));
  }, []);

  const updateCustom = useCallback((field: string, val: string) => {
    setV((p) => ({ ...p, custom_fields: { ...p.custom_fields, [field]: val } }));
  }, []);

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const stepDef = STEPS[stepIdx];
  const preset = findCategory(v.collection);

  const validateForSave = (): boolean => {
    if (!v.name.trim()) {
      setError('Item name is required.');
      setStep('basics');
      return false;
    }
    return true;
  };

  const buildDraft = () => {
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
    };
  };

  const save = async (kind: 'item' | 'draft') => {
    if (kind === 'item' && !validateForSave()) return;
    if (kind === 'draft' && !v.name.trim()) {
      setError('Even a draft needs a name.');
      setStep('basics');
      return;
    }
    setSaving(kind);
    try {
      const created = await createItem(id!, buildDraft());
      // Upload buffered photos
      for (const p of photos) {
        try {
          await uploadPhoto({
            inventoryId: id!,
            itemId: created.id,
            base64: p.base64,
            mimeType: p.mimeType,
          });
        } catch {}
      }
      if (kind === 'item') {
        router.replace(`/(app)/inventory/${id}/item/${created.id}`);
      } else {
        notify('Draft saved', 'You can keep editing or come back later.');
        router.replace(`/(app)/inventory/${id}/item/${created.id}/edit`);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
      setSaving(null);
    }
  };

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
    setPhotos((prev) => [
      ...prev,
      { uri: a.uri, base64: a.base64!, mimeType: a.mimeType ?? 'image/jpeg' },
    ]);
  };

  const removePhoto = (idx: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const next = () => {
    const ni = Math.min(STEPS.length - 1, stepIdx + 1);
    setStep(STEPS[ni].key);
  };
  const back = () => {
    if (stepIdx === 0) router.back();
    else setStep(STEPS[stepIdx - 1].key);
  };

  // Collection dropdown
  const filteredCollections = useMemo(() => {
    const q = collSearch.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, collSearch]);

  const selectedColl = collections.find(
    (c) => c.name.toLowerCase() === (v.collection ?? '').toLowerCase(),
  );
  const selectedPreset = findCategory(v.collection);

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
              <Text style={[styles.title, SERIF]}>Add new item</Text>
              <Text style={styles.subtitle}>
                Catalog a new item in your heirloom inventory.
              </Text>
            </View>
            {isTablet && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={styles.btnGhost}
                  disabled={!!saving}
                  onPress={() => save('draft')}
                >
                  <Text style={styles.btnGhostText}>
                    {saving === 'draft' ? 'Saving…' : 'Save draft'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.btnPrimary}
                  disabled={!!saving}
                  onPress={() => save('item')}
                >
                  <Text style={styles.btnPrimaryText}>
                    {saving === 'item' ? 'Saving…' : 'Save item'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Stepper */}
          {isTablet ? (
            <View style={styles.stepperRow}>
              {STEPS.map((s, i) => {
                const active = s.key === step;
                const done = i < stepIdx;
                return (
                  <Pressable key={s.key} style={styles.stepWrap} onPress={() => setStep(s.key)}>
                    <View
                      style={[
                        styles.stepCircle,
                        active && styles.stepCircleActive,
                        done && styles.stepCircleDone,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNum,
                          (active || done) && { color: colors.onForest },
                        ]}
                      >
                        {done ? '✓' : i + 1}
                      </Text>
                    </View>
                    <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                      {s.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.mobileStepper}>
              <Text style={styles.mobileStepperText}>
                Step {stepIdx + 1} of {STEPS.length} — {stepDef.title}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((stepIdx + 1) / STEPS.length) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>{stepDef.title.toUpperCase()}</Text>

            {error ? (
              <View style={styles.errBox}>
                <Text style={styles.errText}>{error}</Text>
              </View>
            ) : null}

            {step === 'basics' && (
              <View style={{ gap: 14 }}>
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
                    placeholder="Add a brief description of the item, its significance, or any key details."
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

                <Field label="Acquired date">
                  <TextInput
                    style={styles.input}
                    value={v.acquired_date}
                    onChangeText={(t) => update('acquired_date', t)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.mutedSoft}
                  />
                </Field>

                <Field label="Notes (optional)" help="Any additional notes about this item.">
                  <TextInput
                    style={[styles.input, { minHeight: 80 }]}
                    value={v.notes}
                    onChangeText={(t) => update('notes', t)}
                    multiline
                    placeholder="Add any extra notes here…"
                    placeholderTextColor={colors.mutedSoft}
                  />
                </Field>
              </View>
            )}

            {step === 'photos' && (
              <View style={{ gap: 12 }}>
                <Text style={styles.body}>
                  Add up to a handful of photos. You can add more after saving.
                </Text>
                <View style={styles.photoGrid}>
                  {photos.map((p, i) => (
                    <Pressable
                      key={i}
                      style={styles.photoCell}
                      onLongPress={() => removePhoto(i)}
                    >
                      <Image source={{ uri: p.uri }} style={styles.photoImg} />
                      <Pressable style={styles.photoRemove} onPress={() => removePhoto(i)}>
                        <Text style={styles.photoRemoveText}>×</Text>
                      </Pressable>
                    </Pressable>
                  ))}
                  <Pressable style={[styles.photoCell, styles.photoAdd]} onPress={pickPhoto}>
                    <Text style={styles.photoAddPlus}>+</Text>
                    <Text style={styles.photoAddText}>Add photo</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {step === 'details' && (
              <View style={{ gap: 14 }}>
                {!preset ? (
                  <Text style={styles.body}>
                    Pick a collection in Basics to see category-specific fields here.
                  </Text>
                ) : preset.fields.length === 0 ? (
                  <Text style={styles.body}>
                    No extra fields for the “{preset.label}” collection. You're done with
                    this step.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.body}>
                      Extra details for {preset.label}. All optional.
                    </Text>
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
                  </>
                )}
              </View>
            )}

            {step === 'provenance' && (
              <View style={{ gap: 14 }}>
                <Field
                  label="Provenance"
                  help="Where did it come from? Family, an estate, a particular shop?"
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
              </View>
            )}

            {step === 'recipient' && (
              <View style={{ gap: 14 }}>
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
              </View>
            )}

            {step === 'review' && (
              <View style={{ gap: 12 }}>
                <ReviewRow label="Name" value={v.name || '(none)'} />
                <ReviewRow label="Collection" value={selectedPreset?.label ?? v.collection ?? 'Unassigned'} />
                <ReviewRow label="Photos" value={`${photos.length} attached`} />
                <ReviewRow label="Value" value={formatMoney(Number(v.value_amount) || null, v.value_currency)} />
                <ReviewRow label="Location" value={v.location || '—'} />
                <ReviewRow label="Recipient" value={v.intended_recipient_name || '—'} />
                <Text style={styles.body}>
                  Tap Save item to commit. You can edit any field afterwards.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom action area */}
      <View style={styles.bottomBar}>
        <View
          style={[
            styles.bottomInner,
            { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' },
          ]}
        >
          <Pressable style={styles.btnCancel} onPress={back}>
            <Text style={styles.btnCancelText}>
              {stepIdx === 0 ? 'Cancel' : 'Back'}
            </Text>
          </Pressable>
          {!isTablet && (
            <Pressable
              style={styles.btnGhost}
              disabled={!!saving}
              onPress={() => save('draft')}
            >
              <Text style={styles.btnGhostText}>
                {saving === 'draft' ? '…' : 'Save draft'}
              </Text>
            </Pressable>
          )}
          {stepIdx < STEPS.length - 1 ? (
            <Pressable style={styles.btnPrimary} onPress={next}>
              <Text style={styles.btnPrimaryText}>Next →</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.btnPrimary}
              disabled={!!saving}
              onPress={() => save('item')}
            >
              {saving === 'item' ? (
                <ActivityIndicator color={colors.onForest} />
              ) : (
                <Text style={styles.btnPrimaryText}>Save item</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
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
  if (twoCol) {
    return <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>;
  }
  return <View style={{ gap: 14 }}>{children}</View>;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
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
  const displayLabel =
    preset?.label ?? selected?.name ?? selectedName ?? 'Select a collection';
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

            {/* "Create new" affordance */}
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
            ) : (
              <Pressable
                style={[styles.optionRow, { borderTopWidth: 1, borderTopColor: colors.divider }]}
                onPress={() => {
                  setOpen(false);
                  router.push('/(app)/collections/new');
                }}
              >
                <View style={[styles.miniIcon, { backgroundColor: colors.goldSoft }]}>
                  <Text style={[styles.miniIconGlyph, { color: colors.goldDeep }]}>+</Text>
                </View>
                <Text style={[styles.optionTitle, { color: colors.gold }]}>
                  + Create new collection
                </Text>
              </Pressable>
            )}

            {/* Quick-pick presets that aren't in the user's data yet */}
            {!search.trim() && (
              <>
                <Text style={styles.optionSection}>SUGGESTIONS</Text>
                {CATEGORY_PRESETS.filter(
                  (p) => !p.custom && !items.some((c) => c.name.toLowerCase() === p.label.toLowerCase()),
                )
                  .slice(0, 8)
                  .map((p) => (
                    <Pressable
                      key={p.key}
                      style={styles.optionRow}
                      onPress={() => onPick(p.label)}
                    >
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

  btnGhost: {
    backgroundColor: colors.paper,
    borderColor: colors.hairline,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  btnGhostText: { color: colors.ink, fontWeight: '700' },
  btnPrimary: {
    backgroundColor: colors.forest,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPrimaryText: { color: colors.onForest, fontWeight: '700' },
  btnCancel: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  btnCancelText: { color: colors.muted, fontWeight: '700' },

  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    ...shadows.card,
  },
  stepWrap: { alignItems: 'center', flex: 1, gap: 6 },
  stepCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.creamSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: colors.forest },
  stepCircleDone: { backgroundColor: colors.gold },
  stepNum: { color: colors.muted, fontWeight: '700' },
  stepLabel: { color: colors.muted, fontSize: 12 },
  stepLabelActive: { color: colors.ink, fontWeight: '700' },

  mobileStepper: { gap: 8 },
  mobileStepperText: { color: colors.muted, fontWeight: '700' },
  progressTrack: {
    height: 6, backgroundColor: colors.creamSoft, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: colors.forest },

  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    gap: 12,
    ...shadows.card,
  },
  cardEyebrow: {
    fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 1.2,
  },

  body: { color: colors.inkSoft, lineHeight: 22 },

  fieldLabel: { color: colors.inkSoft, fontWeight: '700', fontSize: 14 },
  fieldHelp: { color: colors.muted, fontSize: 12 },
  req: { color: colors.danger },

  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.cream,
    color: colors.ink,
  },

  errBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
  },
  errText: { color: colors.danger, fontWeight: '600' },

  // Collection dropdown
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  miniIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.creamSoft,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  miniIconGlyph: { color: colors.forest, fontWeight: '700' },
  dropdownPlaceholder: { color: colors.mutedSoft, flex: 1, fontSize: 16 },
  dropdownSelected: { color: colors.ink, flex: 1, fontWeight: '600', fontSize: 16 },
  dropdownClear: { color: colors.muted, fontSize: 14, paddingHorizontal: 4 },
  dropdownChevron: { color: colors.muted },

  dropdownPanel: {
    marginTop: 6,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    overflow: 'hidden',
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
    width: 110, height: 110, borderRadius: 10,
    overflow: 'hidden', backgroundColor: colors.creamSoft, position: 'relative',
  },
  photoImg: { width: '100%', height: '100%' },
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

  // Review
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  reviewLabel: { color: colors.muted, fontWeight: '600' },
  reviewValue: { color: colors.ink, fontWeight: '700', flex: 1, textAlign: 'right' },

  // Bottom bar
  bottomBar: {
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    ...shadows.raised,
  },
  bottomInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
