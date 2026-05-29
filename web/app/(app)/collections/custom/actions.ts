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

async function uploadImage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(CUSTOM_COLLECTION_PHOTO_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return path;
}

export async function createCustomCollection(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const name = s(formData.get('name'));
  if (!name) throw new Error('Name is required');

  const supabase = await createSupabaseServerClient();

  let imagePath: string | null = null;
  const file = formData.get('image');
  if (file && file instanceof File && file.size > 0) {
    imagePath = await uploadImage(supabase, user.id, file);
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
  redirect(
    `/collections/${encodeURIComponent(data.id)}?custom=1`,
  );
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
  const file = formData.get('image');
  if (file && file instanceof File && file.size > 0) {
    update.image_path = await uploadImage(supabase, user.id, file);
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
  redirect(`/collections/${encodeURIComponent(id)}?custom=1`);
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
