import { ContactType, AccountType, DealType } from "@/types";

// Use a type assertion to properly type the mock accounts that include owner_id
interface ExtendedAccountType extends AccountType {
  owner_id?: string;
}

export const mockContacts: ContactType[] = [
  {
    id: "c1",
    firstName: "Emma",
    lastName: "Johnson",
    email: "emma.johnson@example.com",
    phone: "+1 (555) 123-4567",
    accountName: "Bella Salon",
    tags: ["Client", "VIP"],
    name: "Emma Johnson", // Add name property
    createdAt: "2023-01-01" // Add createdAt property
  },
  {
    id: "c2",
    firstName: "Olivia",
    lastName: "Smith",
    email: "olivia.smith@example.com",
    phone: "+1 (555) 234-5678",
    accountName: "Glow Spa",
    tags: ["Client"],
    name: "Olivia Smith",
    createdAt: "2023-01-02"
  },
  {
    id: "c3",
    firstName: "James",
    lastName: "Williams",
    email: "james.williams@example.com",
    phone: "+1 (555) 345-6789",
    tags: ["Prospect", "New Lead"],
    name: "James Williams",
    createdAt: "2023-01-03"
  },
  {
    id: "c4",
    firstName: "Sophia",
    lastName: "Brown",
    email: "sophia.brown@example.com",
    phone: "+1 (555) 456-7890",
    accountName: "Pure Beauty",
    tags: ["Client", "Referral"],
    name: "Sophia Brown",
    createdAt: "2023-01-04"
  },
  {
    id: "c5",
    firstName: "Noah",
    lastName: "Miller",
    email: "noah.miller@example.com",
    phone: "+1 (555) 567-8901",
    tags: ["Prospect"],
    name: "Noah Miller",
    createdAt: "2023-01-05"
  },
  {
    id: "c6",
    firstName: "Mia",
    lastName: "Davis",
    email: "mia.davis@example.com",
    phone: "+1 (555) 678-9012",
    accountName: "Serene Wellness",
    tags: ["Client"],
    name: "Mia Davis",
    createdAt: "2023-01-06"
  },
  {
    id: "c7",
    firstName: "Liam",
    lastName: "Wilson",
    email: "liam.wilson@example.com",
    phone: "+1 (555) 789-0123",
    tags: ["Prospect", "Hot Lead"],
    name: "Liam Wilson",
    createdAt: "2023-01-07"
  },
  {
    id: "c8",
    firstName: "Charlotte",
    lastName: "Anderson",
    email: "charlotte.anderson@example.com",
    phone: "+1 (555) 890-1234",
    accountName: "Radiance Studio",
    tags: ["Client"],
    name: "Charlotte Anderson",
    createdAt: "2023-01-08"
  },
  {
    id: "c9",
    firstName: "Elijah",
    lastName: "Thomas",
    email: "elijah.thomas@example.com",
    phone: "+1 (555) 901-2345",
    tags: ["Prospect"],
    name: "Elijah Thomas",
    createdAt: "2023-01-09"
  },
  {
    id: "c10",
    firstName: "Amelia",
    lastName: "Jackson",
    email: "amelia.jackson@example.com",
    phone: "+1 (555) 012-3456",
    accountName: "Bella Salon",
    tags: ["Client", "VIP"],
    name: "Amelia Jackson",
    createdAt: "2023-01-10"
  }
];

export const mockAccounts: ExtendedAccountType[] = [
  {
    id: "a1",
    name: "Bella Salon",
    type: "Salon",
    website: null,
    industry: "Beauty",
    employees: 15,
    createdAt: "2023-01-01",
    owner_id: "user-1",
    contactCount: 3,
    tags: ["Active", "VIP"]
  },
  {
    id: "a2",
    name: "Glow Spa",
    type: "Spa",
    website: null,
    industry: "Beauty",
    employees: 10,
    createdAt: "2023-01-02",
    owner_id: "user-1",
    contactCount: 2,
    tags: ["Active"]
  },
  {
    id: "a3",
    name: "Pure Beauty",
    type: "Beauty Center",
    website: null,
    industry: "Beauty",
    employees: 8,
    createdAt: "2023-01-03",
    owner_id: "user-1",
    contactCount: 1,
    tags: ["Active", "New"]
  },
  {
    id: "a4",
    name: "Serene Wellness",
    type: "Wellness Center",
    website: null,
    industry: "Wellness",
    employees: 12,
    createdAt: "2023-01-04",
    owner_id: "user-1",
    contactCount: 1,
    tags: ["Active"]
  },
  {
    id: "a5",
    name: "Radiance Studio",
    type: "Salon & Spa",
    website: null,
    industry: "Beauty",
    employees: 6,
    createdAt: "2023-01-05",
    owner_id: "user-1",
    contactCount: 1,
    tags: ["Active"]
  },
  {
    id: "a6",
    name: "Harmony Nails",
    type: "Nail Salon",
    website: null,
    industry: "Beauty",
    employees: 4,
    createdAt: "2023-01-06",
    owner_id: "user-1",
    contactCount: 0,
    tags: ["Prospect"]
  },
  {
    id: "a7",
    name: "Zen Treatment",
    type: "Wellness Center",
    website: null,
    industry: "Wellness",
    employees: 7,
    createdAt: "2023-01-07",
    owner_id: "user-1",
    contactCount: 0,
    tags: ["Prospect", "New Lead"]
  },
  {
    id: "a8",
    name: "Luxe Aesthetics",
    type: "Medical Spa",
    website: null,
    industry: "Beauty",
    employees: 9,
    createdAt: "2023-01-08",
    owner_id: "user-1",
    contactCount: 0,
    tags: ["Prospect"]
  }
];

export const mockDeals: DealType[] = [
  {
    id: "d1",
    name: "Annual Service Contract",
    amount: 12000,
    stage: "Closed Won",
    status: "Closed Won",
    probability: 100,
    contactId: "c1",
    account: "a1", // Changed accountId to account
    accountName: "Bella Salon",
    closeDate: "2023-03-15"
  },
  {
    id: "d2",
    name: "Equipment Upgrade",
    amount: 8500,
    stage: "Negotiation",
    status: "Negotiation",
    probability: 70,
    contactId: "c2",
    account: "a2", // Changed accountId to account
    accountName: "Glow Spa",
    closeDate: "2023-05-20"
  },
  {
    id: "d3",
    name: "Product Line Extension",
    amount: 15000,
    stage: "Proposal",
    status: "Proposal",
    probability: 60,
    contactId: "c3",
    account: "a3", // Changed accountId to account
    accountName: "Pure Beauty",
    closeDate: "2023-06-10"
  },
  {
    id: "d4",
    name: "Marketing Campaign",
    amount: 5000,
    stage: "Qualification",
    status: "Qualification",
    probability: 40,
    contactId: "c4",
    account: "a4", // Changed accountId to account
    accountName: "Serene Wellness",
    closeDate: "2023-06-30"
  },
  {
    id: "d5",
    name: "Staff Training Package",
    amount: 3500,
    stage: "Prospect",
    status: "Prospect",
    probability: 20,
    contactId: "c5",
    account: "a5", // Changed accountId to account
    accountName: "Radiance Studio",
    closeDate: "2023-07-10"
  },
  {
    id: "d6",
    name: "Software Implementation",
    amount: 9500,
    stage: "Closed Lost",
    status: "Closed Lost",
    probability: 0,
    contactId: "c6",
    account: "a6", // Changed accountId to account
    accountName: "Harmony Nails",
    closeDate: "2023-02-28"
  },
  {
    id: "d7",
    name: "Consulting Services",
    amount: 7200,
    stage: "Qualification",
    status: "Qualification",
    probability: 45,
    contactId: "c1",
    account: "a1", // Changed accountId to account
    accountName: "Bella Salon",
    closeDate: "2023-07-15"
  },
  {
    id: "d8",
    name: "Product Wholesale Deal",
    amount: 20000,
    stage: "Proposal",
    status: "Proposal",
    probability: 65,
    contactId: "c2",
    account: "a2", // Changed accountId to account
    accountName: "Glow Spa",
    closeDate: "2023-08-01"
  },
  {
    id: "d9",
    name: "Expansion Project",
    amount: 50000,
    stage: "Negotiation",
    status: "Negotiation",
    probability: 75,
    contactId: "c3",
    account: "a3", // Changed accountId to account
    accountName: "Pure Beauty",
    closeDate: "2023-09-15"
  },
  {
    id: "d10",
    name: "Annual Maintenance",
    amount: 4800,
    stage: "Closed Won",
    status: "Closed Won",
    probability: 100,
    contactId: "c4",
    account: "a4", // Changed accountId to account
    accountName: "Serene Wellness",
    closeDate: "2023-04-10"
  }
];
