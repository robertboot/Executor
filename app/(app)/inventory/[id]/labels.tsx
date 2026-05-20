import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { listItems } from '../../../../lib/api';
import { qrUrlForItem } from '../../../../lib/supabase';
import type { Item } from '../../../../lib/types';

// Avery 5160 layout: 30 labels per US Letter page, 3 columns x 10 rows.
// Each label ~1" x 2-5/8" with 0.125" gaps.
const PAGE = { width: '8.5in', height: '11in' };
const LABEL = {
  cols: 3,
  rows: 10,
  cellWidth: '2.625in',
  cellHeight: '1in',
  topMargin: '0.5in',
  leftMargin: '0.1875in',
  colGap: '0.125in',
};

export default function PrintLabels() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Off-screen container to render QR codes to data URIs.
  const qrRefs = useRef<Record<string, { toDataURL: (cb: (s: string) => void) => void } | null>>({});

  useEffect(() => {
    if (id) {
      listItems(id).then((list) => {
        setItems(list);
        setSelected(new Set(list.map((i) => i.id)));
        setLoading(false);
      });
    }
  }, [id]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generatePdf = async () => {
    setBusy(true);
    try {
      const chosen = items.filter((i) => selected.has(i.id));
      if (chosen.length === 0) {
        Alert.alert('Select at least one item');
        return;
      }
      const qrData: Record<string, string> = {};
      for (const it of chosen) {
        const ref = qrRefs.current[it.id];
        if (!ref) continue;
        await new Promise<void>((resolve) => {
          ref.toDataURL((dataUrl) => {
            qrData[it.id] = `data:image/png;base64,${dataUrl}`;
            resolve();
          });
        });
      }

      const html = buildHtml(chosen, qrData);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save / print labels',
        });
      } else {
        Alert.alert('PDF created', uri);
      }
    } catch (e: any) {
      Alert.alert('PDF failed', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.help}>
          Layout: Avery 5160 (US Letter, 30-per-sheet). Print at 100% scale, no fit-to-page.
        </Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 6 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.url} numberOfLines={1}>
                {qrUrlForItem(item.public_id)}
              </Text>
            </View>
            <Switch value={selected.has(item.id)} onValueChange={() => toggle(item.id)} />
          </View>
        )}
      />
      <View style={styles.footer}>
        <Pressable
          style={[styles.button, busy && { opacity: 0.6 }]}
          onPress={generatePdf}
          disabled={busy}
        >
          <Text style={styles.buttonText}>{busy ? 'Generating…' : 'Generate PDF'}</Text>
        </Pressable>
      </View>

      {/* Hidden QR codes for data-URL extraction. */}
      <View style={{ position: 'absolute', opacity: 0, left: -10000 }}>
        {items.map((it) => (
          <QRCode
            key={it.id}
            value={qrUrlForItem(it.public_id)}
            size={200}
            getRef={(ref) => {
              qrRefs.current[it.id] = ref;
            }}
          />
        ))}
      </View>
    </View>
  );
}

function buildHtml(chosen: Item[], qr: Record<string, string>): string {
  const cellsPerPage = LABEL.cols * LABEL.rows;
  const pages: Item[][] = [];
  for (let i = 0; i < chosen.length; i += cellsPerPage) {
    pages.push(chosen.slice(i, i + cellsPerPage));
  }
  const pageHtml = pages
    .map(
      (page) => `
      <div class="page">
        <div class="grid">
          ${page
            .map(
              (it) => `
            <div class="cell">
              <img src="${qr[it.id] ?? ''}" class="qr" />
              <div class="text">
                <div class="title">${escapeHtml(it.name)}</div>
                <div class="meta">Scan to view inheritance details</div>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `,
    )
    .join('');
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; margin: 0; }
  .page { width: ${PAGE.width}; height: ${PAGE.height}; padding-top: ${LABEL.topMargin}; padding-left: ${LABEL.leftMargin}; page-break-after: always; }
  .grid { display: grid; grid-template-columns: repeat(${LABEL.cols}, ${LABEL.cellWidth}); grid-auto-rows: ${LABEL.cellHeight}; column-gap: ${LABEL.colGap}; }
  .cell { display: flex; align-items: center; gap: 6pt; padding: 4pt 6pt; overflow: hidden; }
  .qr { width: 0.8in; height: 0.8in; }
  .text { flex: 1; overflow: hidden; }
  .title { font-size: 9pt; font-weight: 700; color: #111; line-height: 1.1; word-break: break-word; }
  .meta { font-size: 6.5pt; color: #555; margin-top: 2pt; }
</style></head><body>${pageHtml}</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c;
  });
}

const styles = StyleSheet.create({
  header: { padding: 16, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  help: { color: '#4b5563', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  name: { fontWeight: '500', color: '#111827' },
  url: { color: '#6b7280', fontSize: 11 },
  footer: { padding: 16, borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white' },
  button: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '600' },
});
