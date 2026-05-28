// Back-fill embeddings for existing item_photos rows whose embedding is
// NULL. Run once after enabling the scan feature.
//
// Usage:
//   cd web
//   npx tsx scripts/backfill-embeddings.ts          # 50 photos at a time
//   npx tsx scripts/backfill-embeddings.ts --all    # until none remain
//
// Requires SUPABASE_SERVICE_ROLE_KEY + the same EMBEDDING_PROVIDER env
// vars that the runtime uses.

import { createClient } from '@supabase/supabase-js';
import { embedImage, EMBEDDING_DIMS } from '../lib/embeddings';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PHOTO_BUCKET = 'item-photos';

if (!URL || !SERVICE) {
  console.error(
    'Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const supabase = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface Row {
  id: string;
  item_id: string;
  storage_path: string;
  items: { name: string; category: string | null };
}

async function fetchBatch(limit: number): Promise<Row[]> {
  const { data, error } = await supabase
    .from('item_photos')
    .select('id, item_id, storage_path, items!inner(name, category)')
    .is('embedding', null)
    .limit(limit);
  if (error) throw error;
  // Supabase embeds resolve to an array even on a single-row FK. Normalize.
  return ((data ?? []) as unknown as Array<{
    id: string;
    item_id: string;
    storage_path: string;
    items: { name: string; category: string | null }[] | { name: string; category: string | null };
  }>).map((row) => ({
    id: row.id,
    item_id: row.item_id,
    storage_path: row.storage_path,
    items: Array.isArray(row.items) ? row.items[0] : row.items,
  }));
}

async function processOne(row: Row) {
  const { data: blob, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .download(row.storage_path);
  if (error) throw error;
  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64 = buffer.toString('base64');
  const contentType = blob.type || 'image/jpeg';
  const caption = [row.items.name, row.items.category].filter(Boolean).join(' · ');

  const vec = await embedImage({ imageBase64: base64, contentType, caption });
  if (vec.length !== EMBEDDING_DIMS) {
    throw new Error(
      `Embedding length ${vec.length} ≠ expected ${EMBEDDING_DIMS} — schema mismatch`,
    );
  }
  const { error: upErr } = await supabase
    .from('item_photos')
    .update({ embedding: vec })
    .eq('id', row.id);
  if (upErr) throw upErr;
}

async function main() {
  const all = process.argv.includes('--all');
  const batchSize = 50;
  let total = 0;
  let lastBatchSize = batchSize;
  while (lastBatchSize === batchSize || (all && lastBatchSize > 0)) {
    const batch = await fetchBatch(batchSize);
    lastBatchSize = batch.length;
    for (const row of batch) {
      try {
        await processOne(row);
        total += 1;
        process.stdout.write(`  ${total}: ${row.storage_path}\n`);
      } catch (e) {
        process.stderr.write(
          `  ! failed ${row.storage_path}: ${
            e instanceof Error ? e.message : String(e)
          }\n`,
        );
      }
    }
    if (!all) break;
  }
  console.log(`Done. Embedded ${total} photo(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
