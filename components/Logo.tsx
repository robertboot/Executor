import { StyleSheet, Text, View } from 'react-native';
import { brand, colors } from '../lib/theme';

type Variant = 'light' | 'dark' | 'compact';

export default function Logo({ variant = 'dark' }: { variant?: Variant }) {
  const onDark = variant === 'light';
  const compact = variant === 'compact';

  return (
    <View style={styles.wrap}>
      <View style={[styles.crest, onDark && styles.crestLight]}>
        <Text style={[styles.crestGlyph, onDark && { color: colors.gold }]}>❦</Text>
      </View>
      <Text style={[styles.name, onDark && { color: colors.onForest }]}>{brand.name}</Text>
      {!compact && (
        <Text style={[styles.tag, onDark && { color: colors.gold }]}>{brand.tagline}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  crest: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestLight: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: colors.gold, borderWidth: 1 },
  crestGlyph: { fontSize: 28, color: colors.gold, marginTop: -4 },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 2,
  },
  tag: {
    fontSize: 10,
    color: colors.goldDeep,
    letterSpacing: 3,
    fontWeight: '600',
  },
});
