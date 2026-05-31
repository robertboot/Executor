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
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(CONSERVATOR_PHOTO_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });
    if (error) {
      // Don't kill the whole save just because the photo failed —
      // log it and keep the conservator without an avatar.
      console.error('conservator photo upload failed:', error.message);
      return null;
    }
    return path;
  } catch (err) {
    console.error('conservator photo upload threw:', err);
    return null;
  }
}

export async function createConservator(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const personId = s(formData.get('person_id'));

  const levelRaw = s(formData.get('permission_level')) ?? 'viewer';
  if (!VALID_LEVELS.includes(levelRaw as ConservatorPermissionLevel)) {
    throw new Error(`Invalid permission level: ${levelRaw}`);
  }
  const level = levelRaw as ConservatorPermissionLevel;

  const supabase = await createSupabaseServerClient();

  // When linking to a Legacy Person, snapshot their full name onto the
  // conservator row so the row remains intelligible if the link is
  // later removed.
  let name = s(formData.get('name'));
  if (personId) {
    const { data: p } = await supabase
      .from('people')
      .select('first_name, middle_name, last_name')
      .eq('id', personId)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!p) throw new Error('Linked Legacy Person not found');
    const row = p as {
      first_name: string;
      middle_name: string | null;
      last_name: string | null;
    };
    name =
      [row.first_name, row.middle_name, row.last_name]
        .filter((x) => x && x.trim().length > 0)
        .join(' ')
        .trim() || name;
  }
  if (!name) throw new Error('Name is required');

  let photoPath: string | null = null;
  let photoFailed = false;
  const file = formData.get('profile_photo');
  // Skip the conservator-bucket upload when linked — the avatar is
  // sourced from the linked Legacy Person.
  if (!personId && file && file instanceof File && file.size > 0) {
    photoPath = await uploadPhoto(supabase, user.id, file);
    if (!photoPath) photoFailed = true;
  }

  const { data, error } = await supabase
    .from('conservators')
    .insert({
      owner_id: user.id,
      person_id: personId,
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
  revalidatePath('/people');
  redirect(
    photoFailed
      ? `/conservators/${data.id}?photo_failed=1`
      : `/conservators/${data.id}`,
  );
}

export async function updateConservator(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Missing id');

  // 'unlink' clears the existing link; null = leave alone; uuid = link.
  const personFieldRaw = formData.get('person_id');
  const personFieldStr =
    personFieldRaw == null ? null : String(personFieldRaw).trim();
  let personId: string | null | undefined;
  if (personFieldStr === null || personFieldStr === '') {
    personId = undefined;
  } else if (personFieldStr === 'unlink') {
    personId = null;
  } else {
    personId = personFieldStr;
  }

  const supabase = await createSupabaseServerClient();

  let name = s(formData.get('name'));
  if (personId) {
    const { data: p } = await supabase
      .from('people')
      .select('first_name, middle_name, last_name')
      .eq('id', personId)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!p) throw new Error('Linked Legacy Person not found');
    const row = p as {
      first_name: string;
      middle_name: string | null;
      last_name: string | null;
    };
    name =
      [row.first_name, row.middle_name, row.last_name]
        .filter((x) => x && x.trim().length > 0)
        .join(' ')
        .trim() || name;
  }
  if (!name) throw new Error('Name is required');

  const levelRaw = s(formData.get('permission_level')) ?? 'viewer';
  if (!VALID_LEVELS.includes(levelRaw as ConservatorPermissionLevel)) {
    throw new Error(`Invalid permission level: ${levelRaw}`);
  }
  const level = levelRaw as ConservatorPermissionLevel;

  const update: Record<string, unknown> = {
    name,
    relationship: s(formData.get('relationship')),
    email: s(formData.get('email')),
    phone: s(formData.get('phone')),
    notes: s(formData.get('notes')),
    permission_level: level,
  };
  if (personId !== undefined) update.person_id = personId;

  // Skip the conservator-bucket upload when linked — the avatar comes
  // from the linked Legacy Person row.
  let photoFailed = false;
  const file = formData.get('profile_photo');
  if (!personId && file && file instanceof File && file.size > 0) {
    const newPath = await uploadPhoto(supabase, user.id, file);
    if (newPath) {
      update.profile_photo_path = newPath;
    } else {
      photoFailed = true;
    }
  }

  const { error } = await supabase
    .from('conservators')
    .update(update)
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw new Error(`Failed to update: ${error.message}`);

  revalidatePath('/conservators');
  revalidatePath(`/conservators/${id}`);
  revalidatePath('/people');
  redirect(
    photoFailed ? `/conservators/${id}?photo_failed=1` : `/conservators/${id}`,
  );
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
