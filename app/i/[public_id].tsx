import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Disclaimer from '../../components/Disclaimer';
import { photoPublicUrl } from '../../lib/api';
import { formatDate, formatMoney } from '../../lib/format';
import { supabase } from '../../lib/supabase';

interface UnlockedItem {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  condition: string | null;
  location: string | null;
  value_amount: number | null;
  value_currency: string;
  notes: string | null;
  provenance: string | null;
  acquired_date: string | null;
  intended_recipient_name: string | null;
  intended_recipient_contact: string | null;
  bequest_notes: string | null;
  custom_fields: Record<string, unknown>;
  public_id: string;
}

interface PhotoRow {
  caption: string | null;
  storage_path: string;
}

interface UnlockResponse {
  item: UnlockedItem;
  inventory: { id: string; name: string; description: string | null } | null;
  photos: PhotoRow[];
  sibling_items: {
    id: string;
    name: string;
    category: string | null;
    value_amount: number | null;
    value_currency: string;
    public_id: string;
    intended_recipient_name: string | null;
  }[];
}

export default function QRLanding() {
  const { public_id } = useLocalSearchParams<{ public_id: string }>();
  const [code, setCode] = useState('');
  const [data, setData] = useState<UnlockResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    if (!public_id || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const userAgent =
        Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.userAgent : Platform.OS;
      const { data: resp, error: rpcErr } = await supabase.rpc('unlock_item_for_executor', {
        p_public_id: public_id,
        p_code: code.trim(),
        p_user_agent: userAgent,
      });
      if (rpcErr) throw new Error(rpcErr.message);
      const r = resp as { error?: string } & UnlockResponse;
      if (r?.error) throw new Error(r.error);
      setData(r);
    } catch (e: any) {
      setError(e?.message ?? 'Could not unlock');
    } finally {
      setBusy(false);
    }
  };

  if (data) {
    const it = data.item;
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>Heirloom</Text>
        <Text style={styles.title}>{it.name}</Text>
        {data.inventory && (
          <Text style={styles.subtitle}>From the inventory: {data.inventory.name}</Text>
        )}

        {data.photos.length > 0 && (
          <ScrollView horizontal style={{ marginVertical: 12 }}>
            {data.photos.map((p, i) => (
              <Image
                key={i}
                source={{ uri: photoPublicUrl(p.storage_path) }}
                style={styles.photo}
              />
            ))}
          </ScrollView>
        )}

        <Section title="Value">
          <Text style={styles.body1}>{formatMoney(it.value_amount, it.value_currency)}</Text>
        </Section>

        <Section title="Description">
          <Text style={styles.body1}>{it.description ?? '—'}</Text>
        </Section>

        <Section title="Provenance">
          <Text style={styles.body1}>{it.provenance ?? '—'}</Text>
        </Section>

        <Section title="Intended recipient">
          <Row label="Name" value={it.intended_recipient_name} />
          <Row label="Contact" value={it.intended_recipient_contact} />
          {it.bequest_notes ? (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>Owner's wishes</Text>
              <Text style={styles.bequest}>{it.bequest_notes}</Text>
            </View>
          ) : null}
        </Section>

        <Section title="Details">
          <Row label="Collection" value={it.category} />
          <Row label="Condition" value={it.condition} />
          <Row label="Location" value={it.location} />
          <Row label="Acquired" value={formatDate(it.acquired_date)} />
        </Section>

        {Object.keys(it.custom_fields).length > 0 && (
          <Section title="More">
            {Object.entries(it.custom_fields).map(([k, v]) => (
              <Row key={k} label={k} value={String(v)} />
            ))}
          </Section>
        )}

        <Section title={`Other items in ${data.inventory?.name ?? 'this inventory'}`}>
          {data.sibling_items.map((s) => (
            <View key={s.id} style={styles.sibRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sibName}>{s.name}</Text>
                <Text style={styles.sibMeta}>
                  {s.category ?? ''}
                  {s.intended_recipient_name ? ` • for ${s.intended_recipient_name}` : ''}
                </Text>
              </View>
              <Text style={styles.sibValue}>{formatMoney(s.value_amount, s.value_currency)}</Text>
            </View>
          ))}
        </Section>

        <Disclaimer />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.lockedContainer}>
      <Text style={styles.brand}>Heirloom</Text>
      <View style={styles.lockedCard}>
        <Text style={styles.lockedTitle}>This item is part of a private inventory.</Text>
        <Text style={styles.lockedHelp}>
          Enter an executor access code to view its details.
        </Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="ABCD-EFGH-JKLM-NPQR"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.button, busy && { opacity: 0.6 }]}
          onPress={unlock}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Unlock</Text>}
        </Pressable>
      </View>
      <Disclaimer />
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
function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 8, maxWidth: 720, alignSelf: 'center', width: '100%' },
  lockedContainer: {
    padding: 24,
    minHeight: '100%',
    justifyContent: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  brand: { fontSize: 14, color: '#6b7280', textAlign: 'center', letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginTop: 4 },
  subtitle: { color: '#6b7280', marginTop: 2 },
  lockedCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 16,
    gap: 10,
  },
  lockedTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  lockedHelp: { color: '#6b7280' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    fontFamily: 'Courier',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '600' },
  error: { color: '#b91c1c' },
  photo: { width: 200, height: 200, borderRadius: 8, marginRight: 8 },
  section: {
    backgroundColor: 'white',
    padding: 14,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  body1: { color: '#111827', lineHeight: 20 },
  row: { flexDirection: 'row', marginVertical: 3 },
  label: { color: '#6b7280', width: 120, fontWeight: '500' },
  value: { color: '#111827', flex: 1 },
  bequest: { color: '#374151', fontStyle: 'italic', marginTop: 4, lineHeight: 20 },
  sibRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    gap: 12,
  },
  sibName: { color: '#111827', fontWeight: '500' },
  sibMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  sibValue: { color: '#111827', fontWeight: '600' },
});
