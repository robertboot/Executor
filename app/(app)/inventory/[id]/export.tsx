import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getInventory, listItems } from '../../../../lib/api';
import { findCategory } from '../../../../lib/categories';
import { formatDate, formatMoney } from '../../../../lib/format';
import type { Inventory, Item } from '../../../../lib/types';

const CSV_COLUMNS: Array<{ key: keyof Item | 'custom_fields_json'; header: string }> = [
  { key: 'name', header: 'Name' },
  { key: 'category', header: 'Category' },
  { key: 'description', header: 'Description' },
  { key: 'condition', header: 'Condition' },
  { key: 'location', header: 'Location' },
  { key: 'value_amount', header: 'Value' },
  { key: 'value_currency', header: 'Currency' },
  { key: 'acquired_date', header: 'Acquired' },
  { key: 'provenance', header: 'Provenance' },
  { key: 'notes', header: 'Notes' },
  { key: 'intended_recipient_name', header: 'Recipient' },
  { key: 'intended_recipient_contact', header: 'Recipient contact' },
  { key: 'bequest_notes', header: 'Bequest notes' },
  { key: 'custom_fields_json', header: 'Custom fields' },
  { key: 'public_id', header: 'Public ID' },
  { key: 'created_at', header: 'Created' },
  { key: 'updated_at', header: 'Updated' },
];

export default function ExportInventory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inv, setInv] = useState<Inventory | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getInventory(id), listItems(id)]).then(([i, list]) => {
      setInv(i);
      setItems(list);
      setLoading(false);
    });
  }, [id]);

  const exportCsv = async () => {
    if (!inv) return;
    setBusy('csv');
    try {
      const csv = buildCsv(items);
      const filename = `${slugify(inv.name)}-${new Date().toISOString().slice(0, 10)}.csv`;
      await shareTextFile(filename, csv, 'text/csv');
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  const exportPdf = async () => {
    if (!inv) return;
    setBusy('pdf');
    try {
      const html = buildPdfHtml(inv, items);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${inv.name} — inventory report`,
        });
      } else {
        Alert.alert('PDF created', uri);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  if (loading || !inv) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const total = items.reduce(
    (acc, it) => acc + (it.value_amount ?? 0),
    0,
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Export “{inv.name}”</Text>
      <Text style={styles.summary}>
        {items.length} item{items.length === 1 ? '' : 's'} • total value{' '}
        {formatMoney(total, items[0]?.value_currency ?? 'USD')}
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>CSV (spreadsheet)</Text>
        <Text style={styles.help}>
          One row per item with all fields. Open in Excel, Numbers, or Google Sheets.
        </Text>
        <Pressable
          style={[styles.button, busy === 'csv' && { opacity: 0.6 }]}
          onPress={exportCsv}
          disabled={!!busy}
        >
          <Text style={styles.buttonText}>
            {busy === 'csv' ? 'Building…' : 'Download CSV'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>PDF report</Text>
        <Text style={styles.help}>
          Printable summary with every item, intended recipients, and bequest notes.
        </Text>
        <Pressable
          style={[styles.button, busy === 'pdf' && { opacity: 0.6 }]}
          onPress={exportPdf}
          disabled={!!busy}
        >
          <Text style={styles.buttonText}>
            {busy === 'pdf' ? 'Building…' : 'Download PDF'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// =========================================================================

function buildCsv(items: Item[]): string {
  const header = CSV_COLUMNS.map((c) => csvCell(c.header)).join(',');
  const rows = items.map((it) =>
    CSV_COLUMNS.map((c) => {
      if (c.key === 'custom_fields_json') {
        return csvCell(JSON.stringify(it.custom_fields ?? {}));
      }
      const v = it[c.key];
      if (v == null) return '';
      return csvCell(String(v));
    }).join(','),
  );
  return [header, ...rows].join('\r\n');
}

function csvCell(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildPdfHtml(inv: Inventory, items: Item[]): string {
  const total = items.reduce((acc, it) => acc + (it.value_amount ?? 0), 0);
  const currency = items[0]?.value_currency ?? 'USD';
  const rows = items
    .map((it) => {
      const cat = findCategory(it.category);
      const customRows = Object.entries(it.custom_fields ?? {})
        .map(
          ([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(String(v))}</td></tr>`,
        )
        .join('');
      return `
        <article class="item">
          <header>
            <h2>${escapeHtml(it.name)}</h2>
            <div class="meta">
              ${escapeHtml(cat?.label ?? it.category ?? 'Uncategorized')}
              · ${escapeHtml(formatMoney(it.value_amount, it.value_currency))}
            </div>
          </header>
          <table>
            ${row('Description', it.description)}
            ${row('Condition', it.condition)}
            ${row('Location', it.location)}
            ${row('Acquired', formatDate(it.acquired_date))}
            ${row('Provenance', it.provenance)}
            ${row('Notes', it.notes)}
            ${customRows}
            ${row('Recipient', it.intended_recipient_name)}
            ${row('Contact', it.intended_recipient_contact)}
            ${row("Owner's wishes", it.bequest_notes)}
          </table>
        </article>
      `;
    })
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: letter; margin: 0.6in; }
    body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: #111; }
    h1 { font-size: 22pt; margin: 0 0 4pt; }
    .summary { color: #555; margin-bottom: 24pt; }
    .disclaimer {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      padding: 10pt 12pt;
      border-radius: 6pt;
      font-size: 9pt;
      color: #78350f;
      margin-bottom: 16pt;
    }
    .item { page-break-inside: avoid; margin-bottom: 18pt; border-top: 1px solid #ddd; padding-top: 10pt; }
    .item h2 { font-size: 14pt; margin: 0 0 2pt; }
    .meta { color: #666; font-size: 10pt; margin-bottom: 6pt; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    th { text-align: left; width: 130pt; color: #555; font-weight: 500; padding: 2pt 0; vertical-align: top; }
    td { padding: 2pt 0; vertical-align: top; }
  </style></head><body>
    <h1>${escapeHtml(inv.name)}</h1>
    <div class="summary">
      ${items.length} item${items.length === 1 ? '' : 's'} ·
      total value ${escapeHtml(formatMoney(total, currency))} ·
      generated ${escapeHtml(new Date().toLocaleString())}
    </div>
    <div class="disclaimer">
      <strong>Important:</strong> Heirloom is a personal inventory tool. It is
      <strong>not a will</strong> and not legal or estate advice.
    </div>
    ${rows}
  </body></html>`;
}

function row(label: string, value: string | null | undefined): string {
  if (!value) return '';
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'inventory';
}

async function shareTextFile(filename: string, content: string, mimeType: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType, dialogTitle: filename });
  } else {
    Alert.alert('File saved', path);
  }
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  summary: { color: '#6b7280', marginBottom: 4 },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  help: { color: '#6b7280', fontSize: 13, marginBottom: 6 },
  button: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: 'white', fontWeight: '600' },
});
