
import { ContactType, AccountType, DealType } from "@/types";

export const mockContacts: ContactType[] = [
  {
    id: "c1",
    firstName: "Emma",
    lastName: "Johnson",
    email: "emma.johnson@example.com",
    phone: "+1 (555) 123-4567",
    accountName: "Bella Salon",
    tags: ["Client", "VIP"]
  },
  {
    id: "c2",
    firstName: "Olivia",
    lastName: "Smith",
    email: "olivia.smith@example.com",
    phone: "+1 (555) 234-5678",
    accountName: "Glow Spa",
    tags: ["Client"]
  },
  {
    id: "c3",
    firstName: "James",
    lastName: "Williams",
    email: "james.williams@example.com",
    phone: "+1 (555) 345-6789",
    tags: ["Prospect", "New Lead"]
  },
  {
    id: "c4",
    firstName: "Sophia",
    lastName: "Brown",
    email: "sophia.brown@example.com",
    phone: "+1 (555) 456-7890",
    accountName: "Pure Beauty",
    tags: ["Client", "Referral"]
  },
  {
    id: "c5",
    firstName: "Noah",
    lastName: "Miller",
    email: "noah.miller@example.com",
    phone: "+1 (555) 567-8901",
    tags: ["Prospect"]
  },
  {
    id: "c6",
    firstName: "Mia",
    lastName: "Davis",
    email: "mia.davis@example.com",
    phone: "+1 (555) 678-9012",
    accountName: "Serene Wellness",
    tags: ["Client"]
  },
  {
    id: "c7",
    firstName: "Liam",
    lastName: "Wilson",
    email: "liam.wilson@example.com",
    phone: "+1 (555) 789-0123",
    tags: ["Prospect", "Hot Lead"]
  },
  {
    id: "c8",
    firstName: "Charlotte",
    lastName: "Anderson",
    email: "charlotte.anderson@example.com",
    phone: "+1 (555) 890-1234",
    accountName: "Radiance Studio",
    tags: ["Client"]
  },
  {
    id: "c9",
    firstName: "Elijah",
    lastName: "Thomas",
    email: "elijah.thomas@example.com",
    phone: "+1 (555) 901-2345",
    tags: ["Prospect"]
  },
  {
    id: "c10",
    firstName: "Amelia",
    lastName: "Jackson",
    email: "amelia.jackson@example.com",
    phone: "+1 (555) 012-3456",
    accountName: "Bella Salon",
    tags: ["Client", "VIP"]
  }
];

export const mockAccounts: AccountType[] = [
  {
    id: "a1",
    name: "Bella Salon",
    type: "Salon",
    website: null,
    industry: "Beauty",
    createdAt: "2023-01-01",
    updatedAt: "2023-01-01",
    ownerId: "user-1",
    contactCount: 3,
    tags: ["Active", "VIP"]
  },
  {
    id: "a2",
    name: "Glow Spa",
    type: "Spa",
    website: null,
    industry: "Beauty",
    createdAt: "2023-01-02",
    updatedAt: "2023-01-02",
    ownerId: "user-1",
    contactCount: 2,
    tags: ["Active"]
  },
  {
    id: "a3",
    name: "Pure Beauty",
    type: "Beauty Center",
    website: null,
    industry: "Beauty",
    createdAt: "2023-01-03",
    updatedAt: "2023-01-03",
    ownerId: "user-1",
    contactCount: 1,
    tags: ["Active", "New"]
  },
  {
    id: "a4",
    name: "Serene Wellness",
    type: "Wellness Center",
    website: null,
    industry: "Wellness",
    createdAt: "2023-01-04",
    updatedAt: "2023-01-04",
    ownerId: "user-1",
    contactCount: 1,
    tags: ["Active"]
  },
  {
    id: "a5",
    name: "Radiance Studio",
    type: "Salon & Spa",
    website: null,
    industry: "Beauty",
    createdAt: "2023-01-05",
    updatedAt: "2023-01-05",
    ownerId: "user-1",
    contactCount: 1,
    tags: ["Active"]
  },
  {
    id: "a6",
    name: "Harmony Nails",
    type: "Nail Salon",
    website: null,
    industry: "Beauty",
    createdAt: "2023-01-06",
    updatedAt: "2023-01-06",
    ownerId: "user-1",
    contactCount: 0,
    tags: ["Prospect"]
  },
  {
    id: "a7",
    name: "Zen Treatment",
    type: "Wellness Center",
    website: null,
    industry: "Wellness",
    createdAt: "2023-01-07",
    updatedAt: "2023-01-07",
    ownerId: "user-1",
    contactCount: 0,
    tags: ["Prospect", "New Lead"]
  },
  {
    id: "a8",
    name: "Luxe Aesthetics",
    type: "Medical Spa",
    website: null,
    industry: "Beauty",
    createdAt: "2023-01-08",
    updatedAt: "2023-01-08",
    ownerId: "user-1",
    contactCount: 0,
    tags: ["Prospect"]
  }
];

export const mockDeals: DealType[] = [
  {
    id: "d1",
    name: "Annual Service Contract",
    amount: 12000,
    status: "Closed Won",
    accountName: "Bella Salon",
    closeDate: "2023-03-15"
  },
  {
    id: "d2",
    name: "Equipment Upgrade",
    amount: 8500,
    status: "Negotiation",
    accountName: "Glow Spa",
    closeDate: "2023-05-20"
  },
  {
    id: "d3",
    name: "Product Line Extension",
    amount: 15000,
    status: "Proposal",
    accountName: "Pure Beauty",
    closeDate: "2023-06-10"
  },
  {
    id: "d4",
    name: "Marketing Campaign",
    amount: 5000,
    status: "Qualification",
    accountName: "Serene Wellness",
    closeDate: "2023-06-30"
  },
  {
    id: "d5",
    name: "Staff Training Package",
    amount: 3500,
    status: "Prospect",
    accountName: "Radiance Studio"
  },
  {
    id: "d6",
    name: "Software Implementation",
    amount: 9500,
    status: "Closed Lost",
    accountName: "Harmony Nails",
    closeDate: "2023-02-28"
  },
  {
    id: "d7",
    name: "Consulting Services",
    amount: 7200,
    status: "Qualification",
    accountName: "Bella Salon",
    closeDate: "2023-07-15"
  },
  {
    id: "d8",
    name: "Product Wholesale Deal",
    amount: 20000,
    status: "Proposal",
    accountName: "Glow Spa",
    closeDate: "2023-08-01"
  },
  {
    id: "d9",
    name: "Expansion Project",
    amount: 50000,
    status: "Negotiation",
    accountName: "Pure Beauty",
    closeDate: "2023-09-15"
  },
  {
    id: "d10",
    name: "Annual Maintenance",
    amount: 4800,
    status: "Closed Won",
    accountName: "Serene Wellness",
    closeDate: "2023-04-10"
  }
];
