import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Disclaimer from '../../components/Disclaimer';
import { listMyInventories, listMyPendingInvites } from '../../lib/api';
import type { InventoryShare, InventoryWithRole } from '../../lib/types';

export default function InventoriesScreen() {
  const router = useRouter();
  const [inventories, setInventories] = useState<InventoryWithRole[]>([]);
  const [invites, setInvites] = useState<InventoryShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, inv] = await Promise.all([listMyInventories(), listMyPendingInvites()]);
      setInventories(list);
      setInvites(inv);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={inventories}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 16 }}>
          <Disclaimer compact />
          {invites.length > 0 && (
            <Pressable
              style={styles.inviteBanner}
              onPress={() => router.push('/(app)/invites')}
            >
              <Text style={styles.inviteText}>
                You have {invites.length} pending invite{invites.length === 1 ? '' : 's'} —
                tap to review
              </Text>
            </Pressable>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No inventories yet</Text>
          <Text style={styles.emptyText}>
            Create your first inventory below — e.g. “Books”, “Antiques”, “Garage”.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Link href={`/(app)/inventory/${item.id}`} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            <Text style={styles.cardMeta}>
              {item.role === 'owner' ? 'Owner' : item.role === 'contributor' ? 'Contributor' : 'Viewer'}
            </Text>
          </Pressable>
        </Link>
      )}
      ListFooterComponent={
        <View style={{ gap: 8, marginTop: 16 }}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/(app)/new-inventory')}
          >
            <Text style={styles.primaryButtonText}>+ New inventory</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push('/(app)/scan')}>
            <Text style={styles.secondaryText}>Scan a QR code</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push('/(app)/settings')}>
            <Text style={styles.secondaryText}>Settings & sign out</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  cardDesc: { color: '#4b5563', marginTop: 4 },
  cardMeta: {
    color: '#6b7280',
    marginTop: 8,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: { alignItems: 'center', marginTop: 32, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyText: { color: '#6b7280', textAlign: 'center', paddingHorizontal: 24 },
  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: 'white', fontWeight: '600' },
  secondary: { padding: 14, alignItems: 'center', borderRadius: 8, backgroundColor: '#f3f4f6' },
  secondaryText: { color: '#111827', fontWeight: '500' },
  inviteBanner: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  inviteText: { color: '#1e3a8a', fontWeight: '500' },
  error: { color: '#b91c1c' },
});
