'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { embedImage } from '@/lib/embeddings';
import { photoPublicUrl } from '@/lib/api';

export interface ScanMatch {
  item_id: string;
  photo_id: string;
  name: string;
  category: string | null;
  similarity: number; // 0..1, higher = closer
  photo_url: string | null;
}

interface Input {
  imageBase64: string;
  contentType: string;
}

export async function recognizePhoto(input: Input): Promise<ScanMatch[]> {
  // 1. Embed the scanned photo.
  const queryVec = await embedImage({
    imageBase64: input.imageBase64,
    contentType: input.contentType,
  });

  // 2. Vector search against item_photos.embedding using a Postgres RPC
  //    that wraps `ORDER BY embedding <=> $1 LIMIT 5`. We use a server-
  //    side function (`match_item_photos`) so the operator can use the
  //    ivfflat / hnsw index. The RPC must be created via the SQL
  //    migration shipped alongside this file (see web/supabase/migrations).
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('match_item_photos', {
    query_embedding: queryVec,
    match_count: 5,
    similarity_threshold: 0.55,
  });
  if (error) throw error;

  return (data as Array<{
    item_id: string;
    photo_id: string;
    name: string;
    category: string | null;
    similarity: number;
    storage_path: string | null;
  }>).map((row) => ({
    item_id: row.item_id,
    photo_id: row.photo_id,
    name: row.name,
    category: row.category,
    similarity: row.similarity,
    photo_url: row.storage_path ? photoPublicUrl(row.storage_path) : null,
  }));
}
