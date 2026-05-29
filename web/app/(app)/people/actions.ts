'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { PEOPLE_PHOTO_BUCKET } from '@/lib/api';
import type { ItemPersonRole, SideOfFamily } from '@/lib/types';

const VALID_SIDES: SideOfFamily[] = ['paternal', 'maternal', 'other'];
const VALID_ROLES: ItemPersonRole[] = [
  'owner',
  'inherited_from',
  'current_custodian',
  'photographed',
  'created_by',
  'mentioned_in',
  'related_to',
];

function s(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

function asDate(v: FormDataEntryValue | null): string | null {
  const t = s(v);
  return t; // HTML date input is already YYYY-MM-DD
}

export async function createPerson(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const firstName = s(formData.get('first_name'));
  if (!firstName) throw new Error('First name is required');

  const side = s(formData.get('side_of_family')) as SideOfFamily | null;
  if (side && !VALID_SIDES.includes(side)) {
    throw new Error(`Invalid side of family: ${side}`);
  }

  const supabase = await createSupabaseServerClient();

  // Optional photo upload
  let profilePhotoPath: string | null = null;
  const file = formData.get('profile_photo');
  if (file && file instanceof File && file.size > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from(PEOPLE_PHOTO_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });
    if (uploadErr) {
      throw new Error(`Photo upload failed: ${uploadErr.message}`);
    }
    profilePhotoPath = path;
  }

  const { data, error } = await supabase
    .from('people')
    .insert({
      owner_id: user.id,
      first_name: firstName,
      middle_name: s(formData.get('middle_name')),
      last_name: s(formData.get('last_name')),
      email: s(formData.get('email')),
      relationship: s(formData.get('relationship')),
      side_of_family: side,
      birth_date: asDate(formData.get('birth_date')),
      death_date: asDate(formData.get('death_date')),
      biography: s(formData.get('biography')),
      profile_photo_path: profilePhotoPath,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create person: ${error.message}`);

  revalidatePath('/people');
  redirect(`/people/${data.id}`);
}

export async function updatePerson(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Missing person id');

  const firstName = s(formData.get('first_name'));
  if (!firstName) throw new Error('First name is required');

  const side = s(formData.get('side_of_family')) as SideOfFamily | null;
  if (side && !VALID_SIDES.includes(side)) {
    throw new Error(`Invalid side of family: ${side}`);
  }

  const supabase = await createSupabaseServerClient();

  // Optional new photo — falls back to whatever's already on the row.
  let newPhotoPath: string | null = null;
  const file = formData.get('profile_photo');
  if (file && file instanceof File && file.size > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from(PEOPLE_PHOTO_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });
    if (uploadErr) {
      throw new Error(`Photo upload failed: ${uploadErr.message}`);
    }
    newPhotoPath = path;
  }

  const update: Record<string, unknown> = {
    first_name: firstName,
    middle_name: s(formData.get('middle_name')),
    last_name: s(formData.get('last_name')),
    email: s(formData.get('email')),
    relationship: s(formData.get('relationship')),
    side_of_family: side,
    birth_date: asDate(formData.get('birth_date')),
    death_date: asDate(formData.get('death_date')),
    biography: s(formData.get('biography')),
  };
  if (newPhotoPath) update.profile_photo_path = newPhotoPath;

  const { error } = await supabase
    .from('people')
    .update(update)
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw new Error(`Failed to update person: ${error.message}`);

  revalidatePath('/people');
  revalidatePath(`/people/${id}`);
  redirect(`/people/${id}`);
}

export async function deletePerson(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('Missing id');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('people')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw new Error(`Failed to delete person: ${error.message}`);

  revalidatePath('/people');
  redirect('/people');
}

// Attach a person to an item with a role.
export async function addPersonToItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const itemId = String(formData.get('item_id') ?? '').trim();
  const personId = String(formData.get('person_id') ?? '').trim();
  const role = String(formData.get('role') ?? '').trim() as ItemPersonRole;
  const notes = s(formData.get('notes'));

  if (!itemId || !personId) throw new Error('Missing item_id or person_id');
  if (!VALID_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('item_people')
    .insert({ item_id: itemId, person_id: personId, role, notes });

  if (error && !error.message.includes('duplicate')) {
    throw new Error(`Failed to associate: ${error.message}`);
  }

  revalidatePath(`/items/${itemId}`);
  revalidatePath(`/people/${personId}`);
}

export async function removePersonFromItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const linkId = String(formData.get('link_id') ?? '').trim();
  const itemId = String(formData.get('item_id') ?? '').trim();
  if (!linkId) throw new Error('Missing link_id');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('item_people')
    .delete()
    .eq('id', linkId);

  if (error) throw new Error(`Failed to remove: ${error.message}`);

  if (itemId) revalidatePath(`/items/${itemId}`);
  revalidatePath('/people');
}
