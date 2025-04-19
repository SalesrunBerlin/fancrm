
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentDeals } from "@/components/dashboard/RecentDeals";
import { RecentContacts } from "@/components/dashboard/RecentContacts";
import { useDeals } from "@/hooks/useDeals";

export default function Dashboard() {
  const { deals, isLoading } = useDeals();
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <DashboardStats deals={deals || []} isLoading={isLoading} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentDeals />
        <RecentContacts />
      </div>
    </div>
  );
}
