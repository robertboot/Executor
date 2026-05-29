'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { CONSERVATOR_PHOTO_BUCKET } from '@/lib/api';
import type { ConservatorPermissionLevel } from '@/lib/types';

const VALID_LEVELS: ConservatorPermissionLevel[] = [
  'viewer',
  'contributor',
  'curator',
  'owner',
];

function s(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

async function uploadPhoto(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(CONSERVATOR_PHOTO_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return path;
}

export async function createConservator(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const name = s(formData.get('name'));
  if (!name) throw new Error('Name is required');

  const levelRaw = s(formData.get('permission_level')) ?? 'viewer';
  if (!VALID_LEVELS.includes(levelRaw as ConservatorPermissionLevel)) {
    throw new Error(`Invalid permission level: ${levelRaw}`);
  }
  const level = levelRaw as ConservatorPermissionLevel;

  const supabase = await createSupabaseServerClient();

  let photoPath: string | null = null;
  const file = formData.get('profile_photo');
  if (file && file instanceof File && file.size > 0) {
    photoPath = await uploadPhoto(supabase, user.id, file);
  }

  const { data, error } = await supabase
    .from('conservators')
    .insert({
      owner_id: user.id,
      name,
      relationship: s(formData.get('relationship')),
      email: s(formData.get('email')),
      phone: s(formData.get('phone')),
      notes: s(formData.get('notes')),
      permission_level: level,
      profile_photo_path: photoPath,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to invite conservator: ${error.message}`);
  }

  revalidatePath('/conservators');
  redirect(`/conservators/${data.id}`);
}

export async function updateConservator(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Missing id');

  const name = s(formData.get('name'));
  if (!name) throw new Error('Name is required');

  const levelRaw = s(formData.get('permission_level')) ?? 'viewer';
  if (!VALID_LEVELS.includes(levelRaw as ConservatorPermissionLevel)) {
    throw new Error(`Invalid permission level: ${levelRaw}`);
  }
  const level = levelRaw as ConservatorPermissionLevel;

  const supabase = await createSupabaseServerClient();

  const update: Record<string, unknown> = {
    name,
    relationship: s(formData.get('relationship')),
    email: s(formData.get('email')),
    phone: s(formData.get('phone')),
    notes: s(formData.get('notes')),
    permission_level: level,
  };

  const file = formData.get('profile_photo');
  if (file && file instanceof File && file.size > 0) {
    update.profile_photo_path = await uploadPhoto(supabase, user.id, file);
  }

  const { error } = await supabase
    .from('conservators')
    .update(update)
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw new Error(`Failed to update: ${error.message}`);

  revalidatePath('/conservators');
  revalidatePath(`/conservators/${id}`);
  redirect(`/conservators/${id}`);
}

export async function deleteConservator(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Missing id');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('conservators')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw new Error(`Failed to delete: ${error.message}`);

  revalidatePath('/conservators');
  redirect('/conservators');
}
