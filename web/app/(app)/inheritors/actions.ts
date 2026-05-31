'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { INHERITOR_PHOTO_BUCKET } from '@/lib/api';
import type { InheritorStatus } from '@/lib/types';
import { STATUS_OPTIONS } from '@/lib/inheritors';

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
      .from(INHERITOR_PHOTO_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });
    if (error) {
      console.error('inheritor photo upload failed:', error.message);
      return null;
    }
    return path;
  } catch (err) {
    console.error('inheritor photo upload threw:', err);
    return null;
  }
}

export async function createInheritor(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const displayName = s(formData.get('display_name'));
  if (!displayName) throw new Error('Name is required');

  const statusRaw = s(formData.get('status')) ?? 'designated_heir';
  if (!STATUS_OPTIONS.includes(statusRaw as InheritorStatus)) {
    throw new Error(`Invalid status: ${statusRaw}`);
  }
  const status = statusRaw as InheritorStatus;

  const supabase = await createSupabaseServerClient();

  let photoPath: string | null = null;
  let photoFailed = false;
  const file = formData.get('profile_photo');
  if (file && file instanceof File && file.size > 0) {
    photoPath = await uploadPhoto(supabase, user.id, file);
    if (!photoPath) photoFailed = true;
  }

  const { data, error } = await supabase
    .from('inheritors')
    .insert({
      owner_id: user.id,
      display_name: displayName,
      relationship: s(formData.get('relationship')),
      email: s(formData.get('email')),
      status,
      notes: s(formData.get('notes')),
      profile_photo_path: photoPath,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create inheritor: ${error.message}`);

  revalidatePath('/inheritors');
  redirect(
    photoFailed
      ? `/inheritors/${data.id}?photo_failed=1`
      : `/inheritors/${data.id}`,
  );
}

export async function updateInheritor(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Missing id');

  const displayName = s(formData.get('display_name'));
  if (!displayName) throw new Error('Name is required');

  const statusRaw = s(formData.get('status')) ?? 'designated_heir';
  if (!STATUS_OPTIONS.includes(statusRaw as InheritorStatus)) {
    throw new Error(`Invalid status: ${statusRaw}`);
  }
  const status = statusRaw as InheritorStatus;

  const supabase = await createSupabaseServerClient();

  const update: Record<string, unknown> = {
    display_name: displayName,
    relationship: s(formData.get('relationship')),
    email: s(formData.get('email')),
    status,
    notes: s(formData.get('notes')),
  };

  // Only touch profile_photo_path when an upload actually succeeded —
  // a null from uploadPhoto means the storage write failed, so we
  // preserve whatever's already on the row instead of wiping it.
  let photoFailed = false;
  const file = formData.get('profile_photo');
  if (file && file instanceof File && file.size > 0) {
    const newPath = await uploadPhoto(supabase, user.id, file);
    if (newPath) {
      update.profile_photo_path = newPath;
    } else {
      photoFailed = true;
    }
  }

  const { error } = await supabase
    .from('inheritors')
    .update(update)
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw new Error(`Failed to update: ${error.message}`);

  revalidatePath('/inheritors');
  revalidatePath(`/inheritors/${id}`);
  redirect(
    photoFailed ? `/inheritors/${id}?photo_failed=1` : `/inheritors/${id}`,
  );
}

export async function deleteInheritor(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Missing id');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('inheritors')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw new Error(`Failed to delete: ${error.message}`);

  revalidatePath('/inheritors');
  redirect('/inheritors');
}

// Inheritance assignment from the Item edit form.
export async function setItemInheritance(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const itemId = String(formData.get('item_id') ?? '').trim();
  if (!itemId) throw new Error('Missing item_id');

  const designated = s(formData.get('designated_inheritor_id'));
  const alternate = s(formData.get('alternate_inheritor_id'));
  const confidence = s(formData.get('assignment_confidence'));
  const notes = s(formData.get('inheritance_notes'));
  const transfer = s(formData.get('transfer_instructions'));
  const legal = s(formData.get('legal_reference'));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('items')
    .update({
      designated_inheritor_id: designated,
      alternate_inheritor_id: alternate,
      assignment_confidence: confidence,
      inheritance_notes: notes,
      transfer_instructions: transfer,
      legal_reference: legal,
    })
    .eq('id', itemId);

  if (error) throw new Error(`Failed to save inheritance: ${error.message}`);

  revalidatePath(`/items/${itemId}`);
  revalidatePath('/inheritors');
  redirect(`/items/${itemId}`);
}
