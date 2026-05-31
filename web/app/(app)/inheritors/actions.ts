'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { INHERITOR_PHOTO_BUCKET, ensureLinkedPerson } from '@/lib/api';
import type { ConservatorPermissionLevel, InheritorStatus } from '@/lib/types';
import { STATUS_OPTIONS } from '@/lib/inheritors';
import { LEVEL_OPTIONS } from '@/lib/conservators';

function s(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

// Apply the cross-role toggles ("Also Legacy Person", "Also
// Conservator") to a freshly saved inheritor row. Returns the
// resolved person_id (may have been auto-created) so the caller can
// update the inheritor row if it wasn't previously linked.
async function applyCrossRoles({
  supabase,
  userId,
  inheritorId,
  currentPersonId,
  displayName,
  email,
  relationship,
  formData,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  inheritorId: string;
  currentPersonId: string | null;
  displayName: string;
  email: string | null;
  relationship: string | null;
  formData: FormData;
}): Promise<string | null> {
  const alsoPerson = formData.get('also_person') === '1';
  const alsoConservator = formData.get('also_conservator') === '1';
  const conservatorLevelRaw = s(formData.get('conservator_level'));

  // The cross-role toggles all require a Legacy Person to anchor the
  // shared identity. If any cross-role is requested or "Also Legacy
  // Person" is checked, ensure a person exists and link this inheritor
  // to it. Otherwise we leave the inheritor as-is.
  const needPerson = alsoPerson || alsoConservator;
  if (!needPerson) return currentPersonId;

  const personId = await ensureLinkedPerson(
    supabase,
    userId,
    currentPersonId,
    displayName,
    { email, relationship },
  );

  // Link the inheritor row to the (possibly new) person.
  if (personId !== currentPersonId) {
    await supabase
      .from('inheritors')
      .update({ person_id: personId })
      .eq('id', inheritorId)
      .eq('owner_id', userId);
  }

  // Sync the conservator side.
  if (alsoConservator) {
    const level = (conservatorLevelRaw ?? 'viewer') as ConservatorPermissionLevel;
    if (!LEVEL_OPTIONS.includes(level)) {
      throw new Error(`Invalid conservator level: ${conservatorLevelRaw}`);
    }
    const { data: existing } = await supabase
      .from('conservators')
      .select('id')
      .eq('owner_id', userId)
      .eq('person_id', personId)
      .maybeSingle();
    if (existing) {
      await supabase
        .from('conservators')
        .update({ permission_level: level, name: displayName })
        .eq('id', (existing as { id: string }).id);
    } else {
      const { error } = await supabase.from('conservators').insert({
        owner_id: userId,
        person_id: personId,
        name: displayName,
        permission_level: level,
      });
      if (error) {
        console.error('cross-role conservator insert failed:', error.message);
      }
    }
  }

  return personId;
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

  const personId = s(formData.get('person_id'));

  const supabase = await createSupabaseServerClient();

  // If linked to a Legacy Person, the canonical name lives there;
  // snapshot it onto the inheritor row so the row stays usable if the
  // link is later removed.
  let displayName = s(formData.get('display_name'));
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
    displayName =
      [row.first_name, row.middle_name, row.last_name]
        .filter((x) => x && x.trim().length > 0)
        .join(' ')
        .trim() || displayName;
  }
  if (!displayName) throw new Error('Name is required');

  const statusRaw = s(formData.get('status')) ?? 'designated_heir';
  if (!STATUS_OPTIONS.includes(statusRaw as InheritorStatus)) {
    throw new Error(`Invalid status: ${statusRaw}`);
  }
  const status = statusRaw as InheritorStatus;

  let photoPath: string | null = null;
  let photoFailed = false;
  const file = formData.get('profile_photo');
  // Only upload to the inheritor bucket when this row is standalone —
  // when linked to a person, the person's photo is the avatar source.
  if (!personId && file && file instanceof File && file.size > 0) {
    photoPath = await uploadPhoto(supabase, user.id, file);
    if (!photoPath) photoFailed = true;
  }

  const { data, error } = await supabase
    .from('inheritors')
    .insert({
      owner_id: user.id,
      person_id: personId,
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

  // Cross-role toggles run AFTER the inheritor row is in the DB so
  // we have an id to link the (possibly new) Legacy Person to.
  await applyCrossRoles({
    supabase,
    userId: user.id,
    inheritorId: data.id,
    currentPersonId: personId,
    displayName,
    email: s(formData.get('email')),
    relationship: s(formData.get('relationship')),
    formData,
  });

  revalidatePath('/inheritors');
  revalidatePath('/people');
  revalidatePath('/conservators');
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

  // "unlink" sentinel means clear the existing link; null means leave
  // it alone; any other value links to that person id.
  const personFieldRaw = formData.get('person_id');
  const personFieldStr =
    personFieldRaw == null ? null : String(personFieldRaw).trim();
  let personId: string | null | undefined;
  if (personFieldStr === null || personFieldStr === '') {
    personId = undefined; // leave column alone
  } else if (personFieldStr === 'unlink') {
    personId = null; // clear link
  } else {
    personId = personFieldStr;
  }

  const supabase = await createSupabaseServerClient();

  // If linking (or already linked), the canonical name comes from the
  // person row — overwrite the display_name snapshot.
  let displayName = s(formData.get('display_name'));
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
    displayName =
      [row.first_name, row.middle_name, row.last_name]
        .filter((x) => x && x.trim().length > 0)
        .join(' ')
        .trim() || displayName;
  }
  if (!displayName) throw new Error('Name is required');

  const statusRaw = s(formData.get('status')) ?? 'designated_heir';
  if (!STATUS_OPTIONS.includes(statusRaw as InheritorStatus)) {
    throw new Error(`Invalid status: ${statusRaw}`);
  }
  const status = statusRaw as InheritorStatus;

  const update: Record<string, unknown> = {
    display_name: displayName,
    relationship: s(formData.get('relationship')),
    email: s(formData.get('email')),
    status,
    notes: s(formData.get('notes')),
  };
  if (personId !== undefined) update.person_id = personId;

  // Only touch profile_photo_path when an upload actually succeeded —
  // a null from uploadPhoto means the storage write failed, so we
  // preserve whatever's already on the row instead of wiping it. We
  // also skip the upload entirely when this row is linked to a Legacy
  // Person — the avatar comes from the person row.
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
    .from('inheritors')
    .update(update)
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw new Error(`Failed to update: ${error.message}`);

  await applyCrossRoles({
    supabase,
    userId: user.id,
    inheritorId: id,
    currentPersonId:
      personId === undefined ? null : personId, // current = whatever's now on the row
    displayName,
    email: s(formData.get('email')),
    relationship: s(formData.get('relationship')),
    formData,
  });

  revalidatePath('/inheritors');
  revalidatePath(`/inheritors/${id}`);
  revalidatePath('/people');
  revalidatePath('/conservators');
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
