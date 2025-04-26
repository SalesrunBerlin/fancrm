
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  accountId: string | null;
  accountName?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  tags?: string[];
  // Address fields for contacts
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  // Coordinates for map
  latitude?: number | null;
  longitude?: number | null;
}

export interface Account {
  id: string;
  name: string;
  type: string | null;
  website: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  contactCount?: number;
  tags?: string[];
  // Add address fields
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  // Add coordinates for map
  latitude?: number | null;
  longitude?: number | null;
  // Add contacts relation
  contacts?: Contact[];
}

export interface Activity {
  id: string;
  type: string;
  subject: string;
  description?: string;
  scheduled_at?: string | null;
  outcome?: string | null;
  status: "open" | "done" | "planned";
  accountId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  owner_id: string;
  createdAt: string;
  updatedAt: string;
  account?: Account | null;
  contact?: Contact | null;
}
