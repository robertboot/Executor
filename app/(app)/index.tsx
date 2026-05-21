import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth';
import { colors, radius, shadows } from '../../lib/theme';

const SERIF = { fontFamily: 'Georgia' };

export default function Home() {
  const { user } = useAuth();
  return (
    <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
      <Text style={[styles.title, SERIF]}>Heirloom</Text>
      <Text style={styles.body}>Signed in as {user?.email ?? '(no user)'}</Text>

      <StatRow value="128" label="Items Cataloged" tone="sage" />
      <StatRow value="$245,680" label="Total Estimated Value" tone="gold" />
      <StatRow value="6" label="Conservators Assigned" tone="lilac" />
      <StatRow value="12" label="Items Tagged for Sale" tone="periwinkle" />
    </ScrollView>
  );
}

function StatRow({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: 'sage' | 'gold' | 'lilac' | 'periwinkle';
}) {
  const palette = TONES[tone];
  return (
    <Pressable style={styles.stat}>
      <View style={[styles.statSwatch, { backgroundColor: palette.bg }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.statValue, SERIF, { color: palette.fg }]}>{value}</Text>
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
  scroll: { padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  body: { color: colors.inkSoft, lineHeight: 22 },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: 14,
    ...shadows.card,
  },
  statSwatch: { width: 48, height: 48, borderRadius: 12 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { color: colors.mutedSoft, fontSize: 22 },
});
