import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { deleteConservator, listConservators } from '../../../lib/api';
import { colors, radius, shadows } from '../../../lib/theme';
import type { Conservator } from '../../../lib/types';

export default function Conservators() {
  const router = useRouter();
  const [rows, setRows] = useState<Conservator[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRows(await listConservators());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onDelete = (c: Conservator) => {
    Alert.alert(
      `Remove ${c.name}?`,
      'Items assigned to this conservator will keep their record but unlink.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteConservator(c.id);
            await load();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <FlatList
        data={rows}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.title}>Conservators</Text>
            <Text style={styles.subtitle}>
              The people you trust to look after specific items or collections.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No conservators yet</Text>
            <Text style={styles.emptyText}>
              A conservator could be a family member, a restorer, an executor, an
              insurer — anyone who should know about (or take care of) a piece
              when something happens.
            </Text>
          </View>
        }
        renderItem={({ item: c }) => (
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(c.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{c.name}</Text>
              {c.relationship ? (
                <Text style={styles.relationship}>{c.relationship}</Text>
              ) : null}
              {c.email ? <Text style={styles.contact}>{c.email}</Text> : null}
              {c.phone ? <Text style={styles.contact}>{c.phone}</Text> : null}
            </View>
            <Pressable onPress={() => onDelete(c)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        )}
      />
      <View style={styles.fabWrap}>
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/(app)/conservators/new')}
        >
          <Text style={styles.fabText}>+ Add conservator</Text>
        </Pressable>
      </View>
    </View>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  row: {
    backgroundColor: colors.paper,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    ...shadows.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.gold, fontWeight: '700', fontSize: 14 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  relationship: { color: colors.gold, fontSize: 12, fontWeight: '600', marginTop: 2 },
  contact: { color: colors.muted, fontSize: 13, marginTop: 2 },
  removeText: { color: colors.danger, fontWeight: '600' },

  emptyCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.card,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  emptyText: { color: colors.muted, lineHeight: 20 },

  fabWrap: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  fab: {
    backgroundColor: colors.forest,
    padding: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.raised,
  },
  fabText: { color: colors.onForest, fontWeight: '700', fontSize: 16 },
});
