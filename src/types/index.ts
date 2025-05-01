
export interface Product {
  id: string;
  name: string;
  recurrence: 'once' | 'monthly' | 'yearly' | 'hourly';
  productFamilyId?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  productFamily?: ProductFamily;
}

export interface ProductFamily {
  id: string;
  name: string;
  orderPosition: number;
  createdAt: string;
  updatedAt: string;
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

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone?: string;
  accountName?: string;
  accountId?: string;
  tags?: string[];
  name?: string;
}

export interface DealType {
  id: string;
  name: string;
  amount: number;
  status: string;
  closeDate?: string;
  accountId?: string;
  contactId?: string;
  accountName?: string;
  contactName?: string;
  tags?: string[];
}

export type AccountType = Account;
export type ContactType = Contact;

// Updated DuplicateRecord interface
export interface DuplicateRecord {
  importRowIndex: number;
  existingRecord: Record<string, any>;
  matchingFields: string[];
  action: 'create' | 'update';
  rowIndex?: number; // Added for backward compatibility
  record?: Record<string, any>; // Added for backward compatibility
  matches?: {
    id: string;
    values: Record<string, any>;
  }[]; // Added for backward compatibility
  matchingField?: string; // Added for backward compatibility
}
