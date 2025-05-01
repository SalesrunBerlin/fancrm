
import { ContactType, AccountType, DealType } from "@/types";

export const mockContacts: ContactType[] = [
  {
    id: "c1",
    first_name: "Emma",
    last_name: "Johnson",
    email: "emma.johnson@example.com",
    phone: "+1 (555) 123-4567",
    account_id: "a1",
    created_at: "2023-01-01"
  },
  {
    id: "c2",
    first_name: "Olivia",
    last_name: "Smith",
    email: "olivia.smith@example.com",
    phone: "+1 (555) 234-5678",
    account_id: "a2",
    created_at: "2023-01-02"
  },
  {
    id: "c3",
    first_name: "James",
    last_name: "Williams",
    email: "james.williams@example.com",
    phone: "+1 (555) 345-6789",
    created_at: "2023-01-03"
  },
  {
    id: "c4",
    first_name: "Sophia",
    last_name: "Brown",
    email: "sophia.brown@example.com",
    phone: "+1 (555) 456-7890",
    account_id: "a3",
    created_at: "2023-01-04"
  },
  {
    id: "c5",
    first_name: "Noah",
    last_name: "Miller",
    email: "noah.miller@example.com",
    phone: "+1 (555) 567-8901",
    created_at: "2023-01-05"
  },
  {
    id: "c6",
    first_name: "Mia",
    last_name: "Davis",
    email: "mia.davis@example.com",
    phone: "+1 (555) 678-9012",
    account_id: "a4",
    created_at: "2023-01-06"
  },
  {
    id: "c7",
    first_name: "Liam",
    last_name: "Wilson",
    email: "liam.wilson@example.com",
    phone: "+1 (555) 789-0123",
    created_at: "2023-01-07"
  },
  {
    id: "c8",
    first_name: "Charlotte",
    last_name: "Anderson",
    email: "charlotte.anderson@example.com",
    phone: "+1 (555) 890-1234",
    account_id: "a5",
    created_at: "2023-01-08"
  },
  {
    id: "c9",
    first_name: "Elijah",
    last_name: "Thomas",
    email: "elijah.thomas@example.com",
    phone: "+1 (555) 901-2345",
    created_at: "2023-01-09"
  },
  {
    id: "c10",
    first_name: "Amelia",
    last_name: "Jackson",
    email: "amelia.jackson@example.com",
    phone: "+1 (555) 012-3456",
    account_id: "a1",
    created_at: "2023-01-10"
  }
];

export const mockAccounts: AccountType[] = [
  {
    id: "a1",
    name: "Bella Salon",
    industry: "Beauty",
    website: "bellasalon.com",
    created_at: "2023-01-01"
  },
  {
    id: "a2",
    name: "Glow Spa",
    industry: "Beauty",
    website: "glowspa.com",
    created_at: "2023-01-02"
  },
  {
    id: "a3",
    name: "Pure Beauty",
    industry: "Beauty",
    website: "purebeauty.com",
    created_at: "2023-01-03"
  },
  {
    id: "a4",
    name: "Serene Wellness",
    industry: "Wellness",
    website: "serenewellness.com",
    created_at: "2023-01-04"
  },
  {
    id: "a5",
    name: "Radiance Studio",
    industry: "Beauty",
    website: "radiancestudio.com",
    created_at: "2023-01-05"
  },
  {
    id: "a6",
    name: "Harmony Nails",
    industry: "Beauty",
    website: "harmonynails.com",
    created_at: "2023-01-06"
  },
  {
    id: "a7",
    name: "Zen Treatment",
    industry: "Wellness",
    website: "zentreatment.com",
    created_at: "2023-01-07"
  },
  {
    id: "a8",
    name: "Luxe Aesthetics",
    industry: "Beauty",
    website: "luxeaesthetics.com",
    created_at: "2023-01-08"
  }
];

export const mockDeals: DealType[] = [
  {
    id: "d1",
    name: "Annual Service Contract",
    amount: 12000,
    status: "Closed Won",
    account_id: "a1",
    contact_id: "c1",
    close_date: "2023-03-15",
    created_at: "2023-01-15"
  },
  {
    id: "d2",
    name: "Equipment Upgrade",
    amount: 8500,
    status: "Negotiation",
    account_id: "a2",
    contact_id: "c2",
    close_date: "2023-05-20",
    created_at: "2023-01-16"
  },
  {
    id: "d3",
    name: "Product Line Extension",
    amount: 15000,
    status: "Proposal",
    account_id: "a3",
    contact_id: "c4",
    close_date: "2023-06-10",
    created_at: "2023-01-17"
  },
  {
    id: "d4",
    name: "Marketing Campaign",
    amount: 5000,
    status: "Qualification",
    account_id: "a4",
    contact_id: "c6",
    close_date: "2023-06-30",
    created_at: "2023-01-18"
  },
  {
    id: "d5",
    name: "Staff Training Package",
    amount: 3500,
    status: "Prospect",
    account_id: "a5",
    contact_id: "c8",
    created_at: "2023-01-19"
  },
  {
    id: "d6",
    name: "Software Implementation",
    amount: 9500,
    status: "Closed Lost",
    account_id: "a6",
    close_date: "2023-02-28",
    created_at: "2023-01-20"
  },
  {
    id: "d7",
    name: "Consulting Services",
    amount: 7200,
    status: "Qualification",
    account_id: "a1",
    contact_id: "c10",
    close_date: "2023-07-15",
    created_at: "2023-01-21"
  },
  {
    id: "d8",
    name: "Product Wholesale Deal",
    amount: 20000,
    status: "Proposal",
    account_id: "a2",
    contact_id: "c2",
    close_date: "2023-08-01",
    created_at: "2023-01-22"
  },
  {
    id: "d9",
    name: "Expansion Project",
    amount: 50000,
    status: "Negotiation",
    account_id: "a3",
    contact_id: "c4",
    close_date: "2023-09-15",
    created_at: "2023-01-23"
  },
  {
    id: "d10",
    name: "Annual Maintenance",
    amount: 4800,
    status: "Closed Won",
    account_id: "a4",
    contact_id: "c6",
    close_date: "2023-04-10",
    created_at: "2023-01-24"
  }
];
