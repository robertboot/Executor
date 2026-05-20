import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Disclaimer from '../../components/Disclaimer';
import { useAuth } from '../../lib/auth';
import { colors, radius, shadows } from '../../lib/theme';

export default function More() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const items: { label: string; glyph: string; onPress: () => void; tone?: 'danger' }[] = [
    {
      label: 'Pending invites',
      glyph: '✉',
      onPress: () => router.push('/(app)/invites'),
    },
    {
      label: 'Scan a QR sticker',
      glyph: '⊡',
      onPress: () => router.push('/(app)/scan'),
    },
    {
      label: 'New inventory',
      glyph: '＋',
      onPress: () => router.push('/(app)/new-inventory'),
    },
    {
      label: 'Settings',
      glyph: '⚙',
      onPress: () => router.push('/(app)/settings'),
    },
    {
      label: 'Sign out',
      glyph: '↪',
      tone: 'danger',
      onPress: () =>
        Alert.alert('Sign out?', undefined, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign out',
            onPress: async () => {
              await signOut();
              router.replace('/login');
            },
          },
        ]),
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={styles.scroll}
    >
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>Signed in as {user?.email}</Text>

      <View style={styles.list}>
        {items.map((it, idx) => (
          <Pressable
            key={it.label}
            style={[styles.row, idx > 0 && styles.rowDivider]}
            onPress={it.onPress}
          >
            <View style={styles.icon}>
              <Text
                style={[
                  styles.iconGlyph,
                  it.tone === 'danger' && { color: colors.danger },
                ]}
              >
                {it.glyph}
              </Text>
            </View>
            <Text
              style={[
                styles.rowLabel,
                it.tone === 'danger' && { color: colors.danger },
              ]}
            >
              {it.label}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <Disclaimer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { color: colors.muted, marginBottom: 8 },
  list: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { color: colors.forest, fontSize: 16, fontWeight: '700' },
  rowLabel: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: '500' },
  chevron: { color: colors.mutedSoft, fontSize: 22 },
});
