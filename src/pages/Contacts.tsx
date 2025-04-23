import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContacts } from "@/hooks/useContacts";
import { ContactsFilter } from "@/components/contacts/ContactsFilter";
import { ContactsList } from "@/components/contacts/ContactsList";
import { CreateContactForm } from "@/components/contacts/CreateContactForm";
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

export default function Contacts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: contacts = [], isLoading } = useContacts();
  
  console.log("Current user:", user?.id);
  console.log("Contacts loaded:", contacts.length);
  
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return fullName.includes(searchLower) || 
           contact.email?.toLowerCase().includes(searchLower) ||
           contact.phone?.toLowerCase().includes(searchLower) ||
           (contact.tags && contact.tags.some(tag => tag.toLowerCase().includes(searchLower)));
  });
  
  const handleContactClick = (id: string) => {
    toast({
      title: "Contact Selected",
      description: `You clicked on contact with ID: ${id}`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Users className="mr-2 h-6 w-6 text-beauty" />
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
        </Button>
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

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Contact</DialogTitle>
          </DialogHeader>
          <CreateContactForm 
            accountId="" 
            onContactCreated={() => setShowCreateModal(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
