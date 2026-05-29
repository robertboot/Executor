import { createSupabaseServerClient } from './supabase/server';

// Returns the current user's display name, falling back to the
// local-part of their email, then 'You'. Used on the Contributors
// workflow cards so the "Current Custodian" step reads naturally.
export async function getMyDisplayName(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return 'You';
  const meta = data.user.user_metadata?.display_name as string | undefined;
  const fromMeta = meta?.trim();
  if (fromMeta) return fromMeta;
  const email = data.user.email ?? '';
  const fromEmail = email.split('@')[0]?.trim();
  return fromEmail || 'You';
}
