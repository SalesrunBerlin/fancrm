export interface ContactType {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  accountName?: string;
  tags?: string[];
}

export interface AccountType {
  id: string;
  name: string;
  type?: string;
  contactCount?: number;
  tags?: string[];
}

export interface DealType {
  id: string;
  name: string;
  amount: number;
  status: string;
  accountName?: string;
  contactName?: string;
  closeDate?: string;
  accountId?: string;
  contactId?: string;
  tags?: string[];
}

export interface ProductFamily {
  id: string;
  name: string;
  orderPosition: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  recurrence: 'once' | 'monthly' | 'yearly';
  productFamilyId?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  productFamily?: ProductFamily;
}

export type SearchHistoryItem = {
  id: string;
  type: "contact" | "account" | "deal";
  name: string;
  path: string;
  timestamp: number;
};

export interface Account {
  id: string;
  name: string;
  type?: string;
  contactCount?: number;
  tags?: string[];
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  accountName?: string;
  tags?: string[];
}
