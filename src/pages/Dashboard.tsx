
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentDeals } from "@/components/dashboard/RecentDeals";
import { RecentContacts } from "@/components/dashboard/RecentContacts";
import { useDeals } from "@/hooks/useDeals";
import { useContacts } from "@/hooks/useContacts";

export default function Dashboard() {
  const { deals, isLoading: dealsLoading } = useDeals();
  const { contacts, isLoading: contactsLoading } = useContacts();
  
  // Calculate stats for DashboardStats
  const openDealsCount = deals?.filter(deal => 
    deal.status !== "Closed Won" && deal.status !== "Closed Lost"
  ).length || 0;
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <DashboardStats 
        contactCount={contacts?.length || 0}
        accountCount={0} // We'll need to fetch accounts data for this
        openDealsCount={openDealsCount}
        upcomingActivities={0} // Placeholder for future feature
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentDeals deals={deals || []} />
        <RecentContacts contacts={contacts || []} />
      </div>
    </div>
  );
}
