import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth';
import { listMyInventories } from '../../lib/api';
import { colors } from '../../lib/theme';
import type { InventoryWithRole } from '../../lib/types';

export default function Home() {
  const { user } = useAuth();
  const [inventories, setInventories] = useState<InventoryWithRole[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      listMyInventories()
        .then(setInventories)
        .catch((e) => setErr(String(e?.message ?? e)));
    }, []),
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={styles.scroll}
    >
      <Text style={styles.title}>Heirloom</Text>
      <Text style={styles.subtitle}>Signed in as {user?.email ?? '(no user)'}</Text>

      {err ? (
        <View style={styles.errBox}>
          <Text style={styles.errText}>{err}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>Your inventories</Text>
      {inventories.length === 0 ? (
        <Text style={styles.empty}>None yet.</Text>
      ) : (
        inventories.map((inv) => (
          <Link key={inv.id} href={`/(app)/inventory/${inv.id}`} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.cardName}>{inv.name}</Text>
              <Text style={styles.cardRole}>{inv.role}</Text>
            </Pressable>
          </Link>
        ))
      )}

      <Link href="/(app)/new-inventory" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>+ New inventory</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4 },
  section: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    marginTop: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  empty: { color: colors.muted, fontStyle: 'italic' },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cardName: { fontSize: 16, fontWeight: '600', color: colors.ink },
  cardRole: { color: colors.gold, fontSize: 11, fontWeight: '700', marginTop: 4 },
  button: {
    backgroundColor: colors.forest,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: colors.onForest, fontWeight: '700' },
  errBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  errText: { color: '#7f1d1d', fontFamily: 'Courier', fontSize: 12 },
});
