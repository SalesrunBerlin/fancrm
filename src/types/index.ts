
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
  status: string; // Changed from enum to string to allow custom statuses
  accountName?: string;
  contactName?: string;
  closeDate?: string;
  accountId?: string;
  contactId?: string;
}
