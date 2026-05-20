import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createExecutorCode,
  deleteInventory,
  getInventory,
  inviteToInventory,
  listExecutorAccessLog,
  listExecutorCodes,
  listShares,
  revokeExecutorCode,
  revokeShare,
  updateInventory,
  updateShareRole,
} from '../../../../lib/api';
import { formatDateTime, randomExecutorCode } from '../../../../lib/format';
import type {
  ExecutorAccessLogEntry,
  ExecutorCode,
  Inventory,
  InventoryShare,
  Role,
} from '../../../../lib/types';

export default function InventorySettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inv, setInv] = useState<Inventory | null>(null);
  const [shares, setShares] = useState<InventoryShare[]>([]);
  const [codes, setCodes] = useState<ExecutorCode[]>([]);
  const [log, setLog] = useState<ExecutorAccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('viewer');
  const [codeLabel, setCodeLabel] = useState('');
  const [justGeneratedCode, setJustGeneratedCode] = useState<{ id: string; plain: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!id) return;
    const [i, s, c, l] = await Promise.all([
      getInventory(id),
      listShares(id),
      listExecutorCodes(id),
      listExecutorAccessLog(id),
    ]);
    setInv(i);
    setName(i?.name ?? '');
    setDescription(i?.description ?? '');
    setShares(s);
    setCodes(c);
    setLog(l);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading || !inv) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const saveDetails = async () => {
    try {
      await updateInventory(inv.id, { name: name.trim(), description: description.trim() || null });
      Alert.alert('Saved');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? String(e));
    }
  };

  const onDelete = () => {
    Alert.alert('Delete inventory?', 'This deletes the inventory AND all its items, photos, and history. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteInventory(inv.id);
            router.replace('/(app)');
          } catch (e: any) {
            Alert.alert('Delete failed', e?.message ?? String(e));
          }
        },
      },
    ]);
  };

  const onInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    try {
      await inviteToInventory(inv.id, email, inviteRole);
      setInviteEmail('');
      await load();
    } catch (e: any) {
      Alert.alert('Invite failed', e?.message ?? String(e));
    }
  };

  const onChangeRole = async (share: InventoryShare, role: Role) => {
    try {
      await updateShareRole(share.id, role);
      await load();
    } catch (e: any) {
      Alert.alert('Role change failed', e?.message ?? String(e));
    }
  };

  const onRevokeShare = (share: InventoryShare) => {
    Alert.alert('Remove access?', `${share.invited_email} will no longer be able to access this inventory.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await revokeShare(share.id);
          await load();
        },
      },
    ]);
  };

  const onCreateCode = async () => {
    const plain = randomExecutorCode();
    try {
      const code = await createExecutorCode(inv.id, codeLabel.trim() || 'Executor code', plain);
      setJustGeneratedCode({ id: code.id, plain });
      setCodeLabel('');
      await load();
    } catch (e: any) {
      Alert.alert('Could not create code', e?.message ?? String(e));
    }
  };

  const onRevokeCode = (c: ExecutorCode) => {
    Alert.alert('Revoke this code?', 'It will stop working immediately for anyone holding it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          await revokeExecutorCode(c.id);
          await load();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="Inventory details">
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 70 }]}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Pressable style={styles.primary} onPress={saveDetails}>
          <Text style={styles.primaryText}>Save</Text>
        </Pressable>
      </Section>

      <Section title="Sharing">
        <Text style={styles.help}>
          Invite others by email. Viewers can read; Contributors can also edit (every change is
          kept in the item's History so your original notes are never lost).
        </Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="email@example.com"
          />
          <Pressable
            style={[styles.rolePill, inviteRole === 'viewer' && styles.rolePillActive]}
            onPress={() => setInviteRole('viewer')}
          >
            <Text style={inviteRole === 'viewer' ? styles.rolePillTextActive : styles.rolePillText}>
              Viewer
            </Text>
          </Pressable>
          <Pressable
            style={[styles.rolePill, inviteRole === 'contributor' && styles.rolePillActive]}
            onPress={() => setInviteRole('contributor')}
          >
            <Text
              style={inviteRole === 'contributor' ? styles.rolePillTextActive : styles.rolePillText}
            >
              Contrib.
            </Text>
          </Pressable>
        </View>
        <Pressable style={styles.secondary} onPress={onInvite}>
          <Text style={styles.secondaryText}>Send invite</Text>
        </Pressable>

        {shares.length === 0 ? (
          <Text style={styles.empty}>No one else has access yet.</Text>
        ) : (
          shares.map((s) => (
            <View key={s.id} style={styles.shareRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.shareEmail}>{s.invited_email}</Text>
                <Text style={styles.shareMeta}>
                  {s.status} • {s.role}
                </Text>
              </View>
              <Pressable
                style={styles.shareToggle}
                onPress={() => onChangeRole(s, s.role === 'viewer' ? 'contributor' : 'viewer')}
              >
                <Text style={styles.shareToggleText}>
                  → {s.role === 'viewer' ? 'contributor' : 'viewer'}
                </Text>
              </Pressable>
              <Pressable onPress={() => onRevokeShare(s)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
      </Section>

      <Section title="Executor codes">
        <Text style={styles.help}>
          Codes for the people you trust to inherit. Each code unlocks the QR landing page for{' '}
          <Text style={styles.bold}>any item in this inventory</Text>. The plain code is shown{' '}
          <Text style={styles.bold}>once</Text> — store it with your will or give it to your
          executor. We only keep an encrypted copy.
        </Text>

        {justGeneratedCode && (
          <View style={styles.codeReveal}>
            <Text style={styles.codeRevealLabel}>Your new code (copy it now):</Text>
            <Text selectable style={styles.codeRevealText}>
              {justGeneratedCode.plain}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                style={styles.codeRevealButton}
                onPress={async () => {
                  await Clipboard.setStringAsync(justGeneratedCode.plain);
                  Alert.alert('Copied');
                }}
              >
                <Text style={styles.codeRevealButtonText}>Copy</Text>
              </Pressable>
              <Pressable
                style={styles.codeRevealButton}
                onPress={() => setJustGeneratedCode(null)}
              >
                <Text style={styles.codeRevealButtonText}>I've saved it</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.label}>Label (e.g. “For my executor Jane”)</Text>
        <TextInput style={styles.input} value={codeLabel} onChangeText={setCodeLabel} />
        <Pressable style={styles.primary} onPress={onCreateCode}>
          <Text style={styles.primaryText}>Generate code</Text>
        </Pressable>

        {codes.map((c) => (
          <View key={c.id} style={styles.codeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.codeLabel}>{c.label ?? 'Code'}</Text>
              <Text style={styles.codeMeta}>
                Created {formatDateTime(c.created_at)}
                {c.last_used_at ? ` • last used ${formatDateTime(c.last_used_at)}` : ''}
                {c.revoked ? ' • REVOKED' : ''}
              </Text>
            </View>
            {!c.revoked && (
              <Pressable onPress={() => onRevokeCode(c)}>
                <Text style={styles.removeText}>Revoke</Text>
              </Pressable>
            )}
          </View>
        ))}
      </Section>

      <Section title="Access log">
        {log.length === 0 ? (
          <Text style={styles.empty}>No one has unlocked any items yet.</Text>
        ) : (
          log.map((e) => (
            <View key={e.id} style={styles.logRow}>
              <Text style={styles.logWhen}>{formatDateTime(e.accessed_at)}</Text>
              {e.user_agent ? (
                <Text style={styles.logUa} numberOfLines={1}>
                  {e.user_agent}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </Section>

      <Section title="Danger zone">
        <Pressable style={styles.destructive} onPress={onDelete}>
          <Text style={styles.destructiveText}>Delete this inventory</Text>
        </Pressable>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 20, paddingBottom: 60 },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  label: { color: '#374151', fontWeight: '500', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'white',
    marginTop: 4,
  },
  help: { color: '#6b7280', fontSize: 13, lineHeight: 18 },
  bold: { fontWeight: '700', color: '#374151' },
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  rolePillActive: { backgroundColor: '#111827' },
  rolePillText: { color: '#374151' },
  rolePillTextActive: { color: 'white', fontWeight: '600' },
  primary: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryText: { color: 'white', fontWeight: '600' },
  secondary: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryText: { color: '#111827', fontWeight: '500' },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    gap: 8,
  },
  shareEmail: { color: '#111827', fontWeight: '500' },
  shareMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  shareToggle: { paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 6 },
  shareToggleText: { color: '#374151', fontSize: 12 },
  removeText: { color: '#b91c1c', fontWeight: '500' },
  empty: { color: '#6b7280', fontStyle: 'italic', marginTop: 8 },
  codeReveal: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginVertical: 8,
  },
  codeRevealLabel: { color: '#065f46', fontWeight: '500' },
  codeRevealText: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: '700',
    color: '#065f46',
    letterSpacing: 1,
  },
  codeRevealButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#065f46',
    borderRadius: 6,
  },
  codeRevealButtonText: { color: 'white', fontWeight: '600' },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  codeLabel: { color: '#111827', fontWeight: '500' },
  codeMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  logRow: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  logWhen: { color: '#111827' },
  logUa: { color: '#6b7280', fontSize: 12 },
  destructive: {
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  destructiveText: { color: '#b91c1c', fontWeight: '600' },
});
