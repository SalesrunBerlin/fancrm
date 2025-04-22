
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
  // Add address fields for contacts
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
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
