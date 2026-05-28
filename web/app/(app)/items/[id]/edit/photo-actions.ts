'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PHOTO_BUCKET, photoPublicUrl } from '@/lib/api';
import { embedImage, EMBEDDING_DIMS } from '@/lib/embeddings';
import type { ItemPhoto } from '@/lib/types';

/**
 * Upload a photo for an item. Runs entirely on the server: receives
 * base64 bytes from the client, pushes to Supabase Storage, inserts
 * the item_photos row, and (when an embedding provider is configured)
 * generates + persists an embedding so the photo is searchable from
 * the scan page immediately.
 */
export async function uploadItemPhoto(input: {
  itemId: string;
  inventoryId: string;
  imageBase64: string;
  contentType: string;
  caption?: string;
}): Promise<ItemPhoto> {
  const supabase = await createSupabaseServerClient();

  const ext = (input.contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${input.inventoryId}/${input.itemId}/${fileName}`;

  const bytes = Buffer.from(input.imageBase64, 'base64');
  const { error: upErr } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, bytes, {
      contentType: input.contentType,
      upsert: false,
    });
  if (upErr) throw upErr;

  // Insert the row. We get sort_order from the current count for this item.
  const { count } = await supabase
    .from('item_photos')
    .select('id', { count: 'exact', head: true })
    .eq('item_id', input.itemId);

  const { data: photo, error: insErr } = await supabase
    .from('item_photos')
    .insert({
      item_id: input.itemId,
      storage_path: storagePath,
      caption: input.caption ?? null,
      sort_order: count ?? 0,
    })
    .select('*')
    .single();
  if (insErr) throw insErr;

  // Fire-and-forget embedding. If it fails (no provider, network issue,
  // etc.) we still return the photo — the scan back-fill script can
  // pick it up later.
  if (process.env.EMBEDDING_PROVIDER) {
    try {
      const embedding = await embedImage({
        imageBase64: input.imageBase64,
        contentType: input.contentType,
        caption: input.caption,
      });
      if (embedding.length !== EMBEDDING_DIMS) {
        console.warn(
          `Embedding dim mismatch: expected ${EMBEDDING_DIMS}, got ${embedding.length}`,
        );
      } else {
        await supabase
          .from('item_photos')
          .update({ embedding })
          .eq('id', photo.id);
      }
    } catch (e) {
      console.error('Embedding generation failed for photo', photo.id, e);
    }
  }

  revalidatePath(`/items/${input.itemId}`);
  revalidatePath(`/items/${input.itemId}/edit`);
  return photo as ItemPhoto;
}

export async function deleteItemPhoto(photoId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: photo, error: getErr } = await supabase
    .from('item_photos')
    .select('id, item_id, storage_path')
    .eq('id', photoId)
    .single();
  if (getErr) throw getErr;

  await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
  const { error: delErr } = await supabase
    .from('item_photos')
    .delete()
    .eq('id', photoId);
  if (delErr) throw delErr;
  revalidatePath(`/items/${photo.item_id}`);
  revalidatePath(`/items/${photo.item_id}/edit`);
}

/** Public reader for the editor UI to refresh after upload. */
export async function listItemPhotosForEditor(itemId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('item_photos')
    .select('*')
    .eq('item_id', itemId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as ItemPhoto[]).map((p) => ({
    ...p,
    publicUrl: photoPublicUrl(p.storage_path),
  }));
}
