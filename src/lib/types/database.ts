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
}
