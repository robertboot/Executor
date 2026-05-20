import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createCollection } from '../../../lib/api';
import { CATEGORY_PRESETS, type CategoryPreset } from '../../../lib/categories';
import { colors, radius, shadows } from '../../../lib/theme';

export default function NewCollection() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo<CategoryPreset | null>(
    () => CATEGORY_PRESETS.find((c) => c.key === selectedKey) ?? null,
    [selectedKey],
  );

  const presets = CATEGORY_PRESETS.filter((c) => !c.custom);
  const customPreset = CATEGORY_PRESETS.find((c) => c.custom);

  const submit = async () => {
    if (!selected) {
      setError('Pick a collection type to continue.');
      return;
    }
    let name: string;
    if (selected.custom) {
      const trimmed = customName.trim();
      if (!trimmed) {
        setError('Give your custom collection a name.');
        return;
      }
      name = trimmed;
    } else {
      name = selected.label;
    }
    setBusy(true);
    setError(null);
    try {
      await createCollection(name, description.trim() || null);
      router.replace('/(app)/collections');
    } catch (e: any) {
      setError(e?.message ?? 'Could not create collection');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>New Collection</Text>
          <Text style={styles.subtitle}>
            Pick a type so your collection has a recognisable icon.
          </Text>
        </View>

        <View style={styles.grid}>
          {presets.map((p) => (
            <Tile
              key={p.key}
              preset={p}
              selected={selectedKey === p.key}
              onPress={() => setSelectedKey(p.key)}
            />
          ))}
          {customPreset && (
            <Tile
              key={customPreset.key}
              preset={customPreset}
              selected={selectedKey === customPreset.key}
              onPress={() => setSelectedKey(customPreset.key)}
            />
          )}
        </View>

        {selected?.custom && (
          <View style={styles.card}>
            <Text style={styles.label}>Custom collection name</Text>
            <TextInput
              style={styles.input}
              value={customName}
              onChangeText={setCustomName}
              placeholder="e.g. Grandfather's tools"
              placeholderTextColor={colors.mutedSoft}
              autoFocus
            />
          </View>
        )}

        {selected && !selected.custom && (
          <View style={styles.card}>
            <Text style={styles.label}>Selected</Text>
            <Text style={styles.selectedRow}>
              <Text style={styles.selectedGlyph}>{selected.glyph}</Text>
              {'  '}
              {selected.label}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="What lives in this collection?"
            placeholderTextColor={colors.mutedSoft}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, (!selected || busy) && styles.buttonDisabled]}
          disabled={!selected || busy}
          onPress={submit}
        >
          <Text style={styles.buttonText}>
            {busy ? 'Creating…' : 'Create collection'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Tile({
  preset,
  selected,
  onPress,
}: {
  preset: CategoryPreset;
  selected: boolean;
  onPress: () => void;
}) {
  const hasImage = !!preset.iconAsset && !preset.custom;
  return (
    <Pressable
      style={[styles.tile, selected && styles.tileSelected, preset.custom && styles.tileDashed]}
      onPress={onPress}
    >
      {hasImage ? (
        <Image
          source={preset.iconAsset!}
          style={styles.tileImage}
          resizeMode="contain"
        />
      ) : (
        <>
          <View style={[styles.tileIcon, selected && styles.tileIconSelected]}>
            <Text style={styles.tileGlyph}>{preset.glyph}</Text>
          </View>
          <Text
            style={[styles.tileLabel, selected && styles.tileLabelSelected]}
            numberOfLines={2}
          >
            {preset.label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 60, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  tile: {
    width: '31.5%',
    aspectRatio: 0.95,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.card,
  },
  tileSelected: {
    borderColor: colors.gold,
    borderWidth: 2,
    backgroundColor: colors.goldSoft,
  },
  tileDashed: { borderStyle: 'dashed' },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconSelected: { backgroundColor: colors.paper },
  tileGlyph: { fontSize: 24 },
  tileImage: { width: '100%', height: '100%' },
  tileLabel: {
    fontSize: 11,
    color: colors.inkSoft,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
  tileLabelSelected: { color: colors.goldDeep },

  card: {
    backgroundColor: colors.paper,
    padding: 14,
    borderRadius: radius.lg,
    borderColor: colors.hairline,
    borderWidth: 1,
    gap: 6,
    ...shadows.card,
  },
  label: { color: colors.inkSoft, fontWeight: '600', marginBottom: 4 },
  selectedRow: { fontSize: 16, color: colors.ink, fontWeight: '600' },
  selectedGlyph: { fontSize: 22 },
  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.cream,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.forest,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.onForest, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  error: { color: colors.danger },
});
