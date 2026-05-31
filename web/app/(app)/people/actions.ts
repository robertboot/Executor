'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { PEOPLE_PHOTO_BUCKET } from '@/lib/api';
import type {
  ConservatorPermissionLevel,
  InheritorStatus,
  ItemPersonRole,
  SideOfFamily,
} from '@/lib/types';
import { STATUS_OPTIONS } from '@/lib/inheritors';

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
const VALID_LEVELS: ConservatorPermissionLevel[] = [
  'viewer',
  'contributor',
  'curator',
  'owner',
];

// Pull, validate, and apply the "Also designate as Inheritor / Conservator"
// toggles. Linked rows always carry person_id; unchecking only unlinks
// (sets person_id to null) so the underlying assignments aren't lost —
// the user can delete the standalone row from /inheritors or
// /conservators directly if they want it gone.
async function syncPersonRoles(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  personId: string,
  formData: FormData,
  displayName: string,
) {
  const alsoInheritor = formData.get('also_inheritor') === '1';
  const inheritorStatusRaw = s(formData.get('inheritor_status'));
  const alsoConservator = formData.get('also_conservator') === '1';
  const conservatorLevelRaw = s(formData.get('conservator_level'));

  // ----- Inheritor sync -----
  if (alsoInheritor) {
    const status = (inheritorStatusRaw ?? 'designated_heir') as InheritorStatus;
    if (!STATUS_OPTIONS.includes(status)) {
      throw new Error(`Invalid inheritor status: ${inheritorStatusRaw}`);
    }
    const { data: existing } = await supabase
      .from('inheritors')
      .select('id')
      .eq('owner_id', userId)
      .eq('person_id', personId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from('inheritors')
        .update({ status, display_name: displayName })
        .eq('id', (existing as { id: string }).id);
      if (error) {
        console.error('inheritor sync update failed:', error.message);
      }
    } else {
      const { error } = await supabase.from('inheritors').insert({
        owner_id: userId,
        person_id: personId,
        display_name: displayName,
        status,
      });
      if (error) {
        console.error('inheritor sync insert failed:', error.message);
      }
    }
  } else {
    const { error } = await supabase
      .from('inheritors')
      .update({ person_id: null, display_name: displayName })
      .eq('owner_id', userId)
      .eq('person_id', personId);
    if (error) {
      console.error('inheritor unlink failed:', error.message);
    }
  }

  // ----- Conservator sync -----
  if (alsoConservator) {
    const level = (conservatorLevelRaw ?? 'viewer') as ConservatorPermissionLevel;
    if (!VALID_LEVELS.includes(level)) {
      throw new Error(`Invalid conservator level: ${conservatorLevelRaw}`);
    }
    const { data: existing } = await supabase
      .from('conservators')
      .select('id')
      .eq('owner_id', userId)
      .eq('person_id', personId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from('conservators')
        .update({ permission_level: level, name: displayName })
        .eq('id', (existing as { id: string }).id);
      if (error) {
        console.error('conservator sync update failed:', error.message);
      }
    } else {
      const { error } = await supabase.from('conservators').insert({
        owner_id: userId,
        person_id: personId,
        name: displayName,
        permission_level: level,
      });
      if (error) {
        console.error('conservator sync insert failed:', error.message);
      }
    }
  } else {
    const { error } = await supabase
      .from('conservators')
      .update({ person_id: null, name: displayName })
      .eq('owner_id', userId)
      .eq('person_id', personId);
    if (error) {
      console.error('conservator unlink failed:', error.message);
    }
  }
}

function fullName(
  first: string,
  middle: string | null,
  last: string | null,
): string {
  return [first, middle, last]
    .filter((s) => s && s.trim().length > 0)
    .join(' ')
    .trim();
}

function s(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

function asDate(v: FormDataEntryValue | null): string | null {
  const t = s(v);
  return t; // HTML date input is already YYYY-MM-DD
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
      .from(PEOPLE_PHOTO_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });
    if (error) {
      // Don't kill the whole save just because the photo failed —
      // log it and keep the person without an avatar.
      console.error('person photo upload failed:', error.message);
      return null;
    }
    return path;
  } catch (err) {
    console.error('person photo upload threw:', err);
    return null;
  }
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

  // Optional photo upload — degrades gracefully if storage rejects it.
  let profilePhotoPath: string | null = null;
  let photoFailed = false;
  const file = formData.get('profile_photo');
  if (file && file instanceof File && file.size > 0) {
    profilePhotoPath = await uploadPhoto(supabase, user.id, file);
    if (!profilePhotoPath) photoFailed = true;
  }

  const middleName = s(formData.get('middle_name'));
  const lastName = s(formData.get('last_name'));
  const displayName = fullName(firstName, middleName, lastName);

  const { data, error } = await supabase
    .from('people')
    .insert({
      owner_id: user.id,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
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

  await syncPersonRoles(supabase, user.id, data.id, formData, displayName);

  revalidatePath('/people');
  revalidatePath('/inheritors');
  revalidatePath('/conservators');
  redirect(
    photoFailed
      ? `/people/${data.id}?photo_failed=1`
      : `/people/${data.id}`,
  );
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

  // Optional new photo — falls back to whatever's already on the row
  // if the upload fails (e.g. missing storage RLS policy).
  let newPhotoPath: string | null = null;
  let photoFailed = false;
  const file = formData.get('profile_photo');
  if (file && file instanceof File && file.size > 0) {
    newPhotoPath = await uploadPhoto(supabase, user.id, file);
    if (!newPhotoPath) photoFailed = true;
  }

  const middleName = s(formData.get('middle_name'));
  const lastName = s(formData.get('last_name'));
  const displayName = fullName(firstName, middleName, lastName);

  const update: Record<string, unknown> = {
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
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

  await syncPersonRoles(supabase, user.id, id, formData, displayName);

  revalidatePath('/people');
  revalidatePath(`/people/${id}`);
  revalidatePath('/inheritors');
  revalidatePath('/conservators');
  redirect(photoFailed ? `/people/${id}?photo_failed=1` : `/people/${id}`);
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
