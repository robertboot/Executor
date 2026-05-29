// Shared types — mirror the Expo app exactly so the same Supabase rows
// flow through both clients without translation.

export type Role = 'viewer' | 'contributor';
export type ShareStatus = 'pending' | 'accepted' | 'revoked';

export type OnboardingArchetype =
  | 'family-legacy'
  | 'collector'
  | 'luxury'
  | 'historical'
  | 'mixed';

export type OnboardingFocus =
  | 'preservation'
  | 'family-sharing'
  | 'valuation'
  | 'cataloging';

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
  onboarding_completed_at: string | null;
  archetype: OnboardingArchetype | null;
  focus: OnboardingFocus | null;
  selected_collections: string[] | null;
}

export interface Inventory {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  inventory_id: string;
  name: string;
  category: string | null;
  description: string | null;
  condition: string | null;
  location: string | null;
  value_amount: number | null;
  value_currency: string;
  notes: string | null;
  provenance: string | null;
  acquired_date: string | null;
  intended_recipient_name: string | null;
  intended_recipient_contact: string | null;
  bequest_notes: string | null;
  custom_fields: Record<string, unknown>;
  public_id: string;
  tagged_for_sale: boolean;
  conservator_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemPhoto {
  id: string;
  item_id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface ItemRevision {
  id: string;
  item_id: string;
  changed_by: string | null;
  changed_at: string;
  snapshot: Item;
  change_note: string | null;
}

export interface InventoryShare {
  id: string;
  inventory_id: string;
  invited_email: string;
  user_id: string | null;
  role: Role;
  invited_by: string | null;
  status: ShareStatus;
  created_at: string;
  accepted_at: string | null;
}

export interface InventoryWithRole extends Inventory {
  role: 'owner' | Role;
}

export type ConservatorPermissionLevel =
  | 'viewer'
  | 'contributor'
  | 'curator'
  | 'owner';

export interface Conservator {
  id: string;
  owner_id: string;
  name: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  permission_level: ConservatorPermissionLevel;
  profile_photo_path: string | null;
  last_active_at: string | null;
  created_at: string;
}

export interface CollectionWithStats {
  key: string;
  label: string;
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
}

// ============================================================== //
//  People & Provenance                                            //
// ============================================================== //

export type SideOfFamily = 'paternal' | 'maternal' | 'other';
export type Confidence = 'confirmed' | 'likely' | 'unknown';

export type ItemPersonRole =
  | 'owner'
  | 'inherited_from'
  | 'current_custodian'
  | 'photographed'
  | 'created_by'
  | 'mentioned_in'
  | 'related_to';

export type FamilyRelationshipType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'grandparent'
  | 'other';

export interface Person {
  id: string;
  owner_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  relationship: string | null;
  side_of_family: SideOfFamily | null;
  birth_date: string | null;
  death_date: string | null;
  biography: string | null;
  profile_photo_path: string | null;
  confidence: Confidence;
  created_at: string;
  updated_at: string;
}

export interface ItemPerson {
  id: string;
  item_id: string;
  person_id: string;
  role: ItemPersonRole;
  notes: string | null;
  created_at: string;
}

export interface PersonRelationship {
  id: string;
  person_a: string;
  person_b: string;
  relationship_type: FamilyRelationshipType;
  created_at: string;
}

// ============================================================== //
//  Custom Collections                                             //
// ============================================================== //

export interface CustomCollection {
  id: string;
  owner_id: string;
  name: string;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}
