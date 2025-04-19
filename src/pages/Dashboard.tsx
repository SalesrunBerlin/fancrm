
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactCard } from "@/components/contacts/ContactCard";
import { DealCard } from "@/components/deals/DealCard";
import { mockContacts, mockDeals } from "@/data/mockData";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentContacts } from "@/components/dashboard/RecentContacts";
import { RecentDeals } from "@/components/dashboard/RecentDeals";

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  const openDeals = mockDeals.filter(d => d.status !== "Closed Won" && d.status !== "Closed Lost");
  
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
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</span>
      </div>
      
      <DashboardStats 
        contactCount={mockContacts.length}
        accountCount={8}
        openDealsCount={openDeals.length}
        upcomingActivities={3}
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
            <RecentContacts contacts={mockContacts} />
            <RecentDeals deals={mockDeals} />
          </div>
        </TabsContent>
        
        <TabsContent value="recent-contacts">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockContacts.slice(0, 6).map((contact) => (
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
            {mockDeals.slice(0, 6).map((deal) => (
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
