
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users } from "lucide-react";
import { ContactCard } from "@/components/contacts/ContactCard";
import { mockContacts } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { ContactType } from "@/types";

export default function Contacts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  
  const filteredContacts = mockContacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (contact.phone && contact.phone.includes(searchQuery));
  });
  
  const handleContactClick = (id: string) => {
    toast({
      title: "Contact Selected",
      description: `You clicked on contact with ID: ${id}`,
    });
  };

  const handleAddNew = () => {
    toast({
      title: "Create New Contact",
      description: "This would open a form to create a new contact.",
    });
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Users className="mr-2 h-6 w-6 text-beauty" />
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        </div>
        <Button onClick={handleAddNew} className="bg-beauty hover:bg-beauty-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>
            
            <Tabs defaultValue="all" className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="clients">Clients</TabsTrigger>
                <TabsTrigger value="prospects">Prospects</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-beauty hover:bg-beauty-dark" : ""}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={viewMode === "table" ? "bg-beauty hover:bg-beauty-dark" : ""}
              >
                Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" className="space-y-4">
        <TabsContent value="all" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map((contact) => (
                <ContactCard 
                  key={contact.id} 
                  contact={contact} 
                  onClick={handleContactClick}
                />
              ))}
            </div>
          ) : (
            <ContactsTable contacts={filteredContacts} onContactClick={handleContactClick} />
          )}
        </TabsContent>
        
        <TabsContent value="clients" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredContacts
                .filter(contact => contact.tags?.includes("Client"))
                .map((contact) => (
                  <ContactCard 
                    key={contact.id} 
                    contact={contact} 
                    onClick={handleContactClick}
                  />
                ))}
            </div>
          ) : (
            <ContactsTable 
              contacts={filteredContacts.filter(contact => contact.tags?.includes("Client"))} 
              onContactClick={handleContactClick} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="prospects" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredContacts
                .filter(contact => contact.tags?.includes("Prospect"))
                .map((contact) => (
                  <ContactCard 
                    key={contact.id} 
                    contact={contact} 
                    onClick={handleContactClick}
                  />
                ))}
            </div>
          ) : (
            <ContactsTable 
              contacts={filteredContacts.filter(contact => contact.tags?.includes("Prospect"))} 
              onContactClick={handleContactClick} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ContactsTableProps {
  contacts: ContactType[];
  onContactClick: (id: string) => void;
}

function ContactsTable({ contacts, onContactClick }: ContactsTableProps) {
  return (
    <div className="crm-table-wrapper">
      <table className="crm-table">
        <thead className="crm-table-header">
          <tr className="crm-table-row">
            <th className="crm-table-head">Name</th>
            <th className="crm-table-head">Email</th>
            <th className="crm-table-head">Phone</th>
            <th className="crm-table-head">Account</th>
            <th className="crm-table-head">Tags</th>
          </tr>
        </thead>
        <tbody className="crm-table-body">
          {contacts.map((contact) => (
            <tr 
              key={contact.id} 
              className="crm-table-row cursor-pointer" 
              onClick={() => onContactClick(contact.id)}
            >
              <td className="crm-table-cell font-medium">
                {contact.firstName} {contact.lastName}
              </td>
              <td className="crm-table-cell">{contact.email}</td>
              <td className="crm-table-cell">{contact.phone || "-"}</td>
              <td className="crm-table-cell">{contact.accountName || "-"}</td>
              <td className="crm-table-cell">
                <div className="flex flex-wrap gap-1">
                  {contact.tags?.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
