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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customName, setCustomName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = useMemo(() => CATEGORY_PRESETS.filter((c) => !c.custom), []);
  const customPreset = useMemo(
    () => CATEGORY_PRESETS.find((c) => c.custom),
    [],
  );

  const toggle = (key: string) => {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // What will actually be created?
  const customWanted = customPreset ? selected.has(customPreset.key) : false;
  const presetCount = [...selected].filter(
    (k) => !customPreset || k !== customPreset.key,
  ).length;
  const customCount = customWanted && customName.trim() ? 1 : 0;
  const totalCount = presetCount + customCount;

  const submit = async () => {
    if (selected.size === 0) {
      setError('Pick at least one collection to add.');
      return;
    }
    if (customWanted && !customName.trim()) {
      setError('Give your custom collection a name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      for (const key of selected) {
        if (customPreset && key === customPreset.key) continue;
        const preset = presets.find((p) => p.key === key);
        if (preset) await createCollection(preset.label, null);
      }
      if (customWanted) {
        await createCollection(customName.trim(), null);
      }
      router.replace('/(app)/collections');
    } catch (e: any) {
      setError(e?.message ?? 'Could not save collections');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={styles.title}>Add Collections</Text>
          <Text style={styles.subtitle}>
            Tap as many as you like. Each becomes its own collection.
          </Text>
        </View>

        <View style={styles.grid}>
          {presets.map((p) => (
            <Tile
              key={p.key}
              preset={p}
              selected={selected.has(p.key)}
              onPress={() => toggle(p.key)}
            />
          ))}
          {customPreset && (
            <Tile
              key={customPreset.key}
              preset={customPreset}
              selected={selected.has(customPreset.key)}
              onPress={() => toggle(customPreset.key)}
            />
          )}
        </View>

        {customWanted && (
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

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerCount}>
          {selected.size === 0
            ? 'Nothing selected'
            : `${selected.size} selected`}
        </Text>
        <Pressable
          style={[
            styles.button,
            (totalCount === 0 || busy) && styles.buttonDisabled,
          ]}
          disabled={totalCount === 0 || busy}
          onPress={submit}
        >
          <Text style={styles.buttonText}>
            {busy
              ? 'Adding…'
              : totalCount <= 1
                ? 'Add collection'
                : `Add ${totalCount} collections`}
          </Text>
        </Pressable>
      </View>
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
      style={[
        styles.tile,
        selected && styles.tileSelected,
        preset.custom && styles.tileDashed,
      ]}
      onPress={onPress}
    >
      {hasImage ? (
        <Image
          source={preset.iconAsset!}
          style={styles.tileImage}
          resizeMode="contain"
        />
      ) : preset.custom ? (
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
      ) : (
        <Text
          style={[styles.tileTextOnly, selected && styles.tileLabelSelected]}
          numberOfLines={3}
        >
          {preset.label}
        </Text>
      )}
      {selected && (
        <View style={styles.checkBadge}>
          <Text style={styles.checkBadgeText}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 120, gap: 16 },
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
    padding: 6,
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
  tileTextOnly: {
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  tileLabelSelected: { color: colors.goldDeep },

  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: { color: colors.gold, fontWeight: '700', fontSize: 12 },

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
  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.cream,
    color: colors.ink,
  },

  error: { color: colors.danger },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    padding: 14,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.raised,
  },
  footerCount: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  button: {
    flex: 1,
    backgroundColor: colors.forest,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: colors.onForest,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
