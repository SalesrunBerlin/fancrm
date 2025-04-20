
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentDeals } from "@/components/dashboard/RecentDeals";
import { RecentContacts } from "@/components/dashboard/RecentContacts";
import { useDeals } from "@/hooks/useDeals";
import { useContacts } from "@/hooks/useContacts";
import { useAccounts } from "@/hooks/useAccounts";

export default function Dashboard() {
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  
  // Calculate stats for DashboardStats
  const totalContacts = contacts?.length || 0;
  const totalAccounts = accounts?.length || 0;
  const openDealsCount = deals?.filter(deal => 
    deal.status !== "Closed Won" && deal.status !== "Closed Lost"
  ).length || 0;
  
  const isLoading = dealsLoading || contactsLoading || accountsLoading;
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <DashboardStats 
        contactCount={totalContacts}
        accountCount={totalAccounts}
        openDealsCount={openDealsCount}
        upcomingActivities={0}
        isLoading={isLoading}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentDeals deals={deals || []} />
        <RecentContacts contacts={contacts || []} />
      </div>
    </div>
  );
}
