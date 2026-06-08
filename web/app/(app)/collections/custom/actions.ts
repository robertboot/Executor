'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { CUSTOM_COLLECTION_PHOTO_BUCKET } from '@/lib/api';

function s(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

type UploadResult =
  | { ok: true; path: string }
  | { ok: false; reason: string };

// Uploads the file and returns the storage path, or a reason string
// explaining the failure. Never throws — callers decide whether to
// keep going without the image.
async function uploadImage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  file: File,
): Promise<UploadResult> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(CUSTOM_COLLECTION_PHOTO_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });
    if (error) {
      console.error('custom collection image upload failed:', error.message);
      return { ok: false, reason: error.message };
    }
    return { ok: true, path };
  } catch (err) {
    console.error('custom collection image upload threw:', err);
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

function appendQuery(href: string, key: string, value: string): string {
  const sep = href.includes('?') ? '&' : '?';
  return `${href}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

export async function createCustomCollection(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const name = s(formData.get('name'));
  if (!name) throw new Error('Name is required');

  const supabase = await createSupabaseServerClient();

  let imagePath: string | null = null;
  let photoFailReason: string | null = null;
  const file = formData.get('image');
  if (file && file instanceof File && file.size > 0) {
    const res = await uploadImage(supabase, user.id, file);
    if (res.ok) {
      imagePath = res.path;
    } else {
      photoFailReason = res.reason;
    }
  }

  const { data, error } = await supabase
    .from('custom_collections')
    .insert({
      owner_id: user.id,
      name,
      image_path: imagePath,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create collection: ${error.message}`);
  }

  revalidatePath('/collections');
  revalidatePath('/home');

  let target = `/collections/${encodeURIComponent(data.id)}?custom=1`;
  if (photoFailReason) {
    target = appendQuery(target, 'photo_failed', '1');
    target = appendQuery(target, 'photo_reason', photoFailReason);
  }
  redirect(target);
}

export async function updateCustomCollection(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Missing id');

  const name = s(formData.get('name'));
  if (!name) throw new Error('Name is required');

  const supabase = await createSupabaseServerClient();

  const update: Record<string, unknown> = { name };
  let photoFailReason: string | null = null;
  const file = formData.get('image');
  if (file && file instanceof File && file.size > 0) {
    const res = await uploadImage(supabase, user.id, file);
    if (res.ok) {
      update.image_path = res.path;
    } else {
      photoFailReason = res.reason;
    }
  }

  const { error } = await supabase
    .from('custom_collections')
    .update(update)
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) {
    throw new Error(`Failed to update collection: ${error.message}`);
  }

  revalidatePath('/collections');
  revalidatePath(`/collections/${id}`);
  revalidatePath('/home');
  let target = `/collections/${encodeURIComponent(id)}?custom=1`;
  if (photoFailReason) {
    target = appendQuery(target, 'photo_failed', '1');
    target = appendQuery(target, 'photo_reason', photoFailReason);
  }
  redirect(target);
}

export async function deleteCustomCollection(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Missing id');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('custom_collections')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) {
    throw new Error(`Failed to delete collection: ${error.message}`);
  }

  revalidatePath('/collections');
  revalidatePath('/home');
  redirect('/collections');
}
