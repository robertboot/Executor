export type Role = 'viewer' | 'contributor';
export type ShareStatus = 'pending' | 'accepted' | 'revoked';

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
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

export interface ExecutorCode {
  id: string;
  inventory_id: string;
  label: string | null;
  code_hash: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

export interface ExecutorAccessLogEntry {
  id: string;
  executor_code_id: string;
  item_public_id: string | null;
  accessed_at: string;
  user_agent: string | null;
}

export interface InventoryWithRole extends Inventory {
  role: 'owner' | Role;
}
