
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactCard } from "@/components/contacts/ContactCard";
import { DealCard } from "@/components/deals/DealCard";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentContacts } from "@/components/dashboard/RecentContacts";
import { RecentDeals } from "@/components/dashboard/RecentDeals";
import { useContacts } from "@/hooks/useContacts";
import { useDeals } from "@/hooks/useDeals";
import { useAccounts } from "@/hooks/useAccounts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { contacts, isLoading: isLoadingContacts } = useContacts();
  const { deals, isLoading: isLoadingDeals } = useDeals();
  const { accounts, isLoading: isLoadingAccounts } = useAccounts();
  
  const openDeals = deals?.filter(d => d.status !== "Closed Won" && d.status !== "Closed Lost") || [];
  
  const handleContactClick = (id: string) => {
    toast({
      title: "Contact Selected",
      description: `You clicked on contact with ID: ${id}`,
    });
  };
  
  const handleDealClick = (id: string) => {
    toast({
      title: "Deal Selected",
      description: `You clicked on deal with ID: ${id}`,
    });
  };

  if (isLoadingContacts || isLoadingDeals || isLoadingAccounts) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</span>
      </div>
      
      <DashboardStats 
        contactCount={contacts?.length || 0}
        accountCount={accounts?.length || 0}
        openDealsCount={openDeals.length}
        upcomingActivities={0}
      />
      
      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent-contacts">Recent Contacts</TabsTrigger>
          <TabsTrigger value="deals-pipeline">Deal Pipeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Activities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <RecentContacts contacts={contacts || []} />
            <RecentDeals deals={deals || []} />
          </div>
        </TabsContent>
        
        <TabsContent value="recent-contacts">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(contacts || []).slice(0, 6).map((contact) => (
              <ContactCard 
                key={contact.id} 
                contact={contact} 
                onClick={handleContactClick}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="deals-pipeline">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(deals || []).slice(0, 6).map((deal) => (
              <DealCard 
                key={deal.id} 
                deal={deal} 
                onClick={handleDealClick}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
