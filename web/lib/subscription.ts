// Subscription gate.
//
// Subscriptions live in an external system (Stripe / your billing tool).
// At runtime, we don't want to call that on every request — so we mirror
// the active-customer set into Supabase as `profiles.subscription_status`
// and read it from there. Until that wiring is in place, we degrade to
// "everyone is active" so dev + early-tester accounts work.
//
// When you're ready to enable gating:
//   1. Add a `subscription_status text` column to `profiles` (values:
//      'active' | 'past_due' | 'canceled' | 'trial' | 'none').
//   2. From your billing webhook handler, upsert that column on every
//      subscription change.
//   3. Set HEIRLOOM_GATE_ENABLED=1 in Vercel env.
// Then this function will return real status.

import { createSupabaseServerClient } from './supabase/server';

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'past_due'
  | 'canceled'
  | 'none';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isActive: boolean;
  isGated: boolean;
}

const GATE_ENABLED = process.env.HEIRLOOM_GATE_ENABLED === '1';

export async function getSubscription(): Promise<SubscriptionInfo> {
  if (!GATE_ENABLED) {
    return { status: 'active', isActive: true, isGated: false };
  }
  const supabase = await createSupabaseServerClient();
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) {
    return { status: 'none', isActive: false, isGated: true };
  }
  const { data } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', me.user.id)
    .maybeSingle();
  const status = (data?.subscription_status as SubscriptionStatus) ?? 'none';
  const isActive = status === 'active' || status === 'trial';
  return { status, isActive, isGated: true };
}
