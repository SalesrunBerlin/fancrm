
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactCard } from "@/components/contacts/ContactCard";
import { DealCard } from "@/components/deals/DealCard";
import { Users, Briefcase, Building, Calendar } from "lucide-react";
import { mockContacts, mockDeals } from "@/data/mockData";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Contacts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockContacts.length}</div>
            <p className="text-xs text-muted-foreground">
              +3% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Accounts
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Deals
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDeals.filter(d => d.status !== "Closed Won" && d.status !== "Closed Lost").length}</div>
            <p className="text-xs text-muted-foreground">
              +5 new this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Activities
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Next: Today at 2pm
            </p>
          </CardContent>
        </Card>
      </div>
      
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
            <Card>
              <CardHeader>
                <CardTitle>Recent Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockContacts.slice(0, 3).map((contact) => (
                    <div key={contact.id} className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-beauty-light flex items-center justify-center text-beauty-dark font-medium mr-3">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDeals.slice(0, 3).map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{deal.name}</p>
                        <p className="text-sm text-muted-foreground">{deal.accountName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${deal.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{deal.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
