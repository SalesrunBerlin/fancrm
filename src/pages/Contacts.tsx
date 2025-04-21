
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContacts } from "@/hooks/useContacts";
import { ContactsFilter } from "@/components/contacts/ContactsFilter";
import { ContactsList } from "@/components/contacts/ContactsList";

export default function Contacts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const { data: contacts = [], isLoading } = useContacts();
  
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (contact.phone && contact.phone.includes(searchQuery));
  });
  
  const handleContactClick = (id: string) => {
    toast({
      title: "Contact Selected",
      description: `You clicked on contact with ID: ${id}`,
    });
  };
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Users className="mr-2 h-6 w-6 text-beauty" />
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        </div>
      </div>
      
      <ContactsFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <ContactsList
        contacts={filteredContacts}
        viewMode={viewMode}
        onContactClick={handleContactClick}
      />
    </div>
  );
}
