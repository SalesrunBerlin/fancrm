
// This file contains the types that match the database schema
// It is used for type checking when making queries to Supabase

export interface Activities {
  id: string;
  type: string;
  subject: string;
  description?: string | null;
  scheduled_at?: string | null;
  end_time?: string | null;
  outcome?: string | null;
  status: "open" | "done" | "planned";
  account_id?: string | null;
  contact_id?: string | null;
  deal_id?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Contacts {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  account_id?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Accounts {
  id: string;
  name: string;
  type?: string | null;
  website?: string | null;
  industry?: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Deals {
  id: string;
  name: string;
  amount: number;
  status: string;
  close_date?: string | null;
  account_id?: string | null;
  contact_id?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface DealStatuses {
  id: string;
  name: string;
  order_position: number;
  color?: string | null;
  owner_id: string;
}

// Extend the Database namespace to include our tables
export interface ExtendedDatabase {
  activities: Activities;
  contacts: Contacts;
  accounts: Accounts;
  deals: Deals;
  deal_statuses: DealStatuses;
}
