
// Update the Product type to include 'hourly' in recurrence
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

// Update the Contact type to include tags
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  accountName?: string;
  tags?: string[];
}

// Update the ContactType to match the Contact interface
export interface ContactType {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  accountName?: string;
  tags?: string[];
}
