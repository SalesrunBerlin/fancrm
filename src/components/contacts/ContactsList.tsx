
import { Contact } from "@/lib/types/database";
import { ContactCard } from "./ContactCard";
import { ContactsTable } from "./ContactsTable";
import { useNavigate } from "react-router-dom";

interface ContactsListProps {
  contacts: Contact[];
  viewMode: "grid" | "table";
  onContactClick?: (id: string) => void;
}

export function ContactsList({ contacts, viewMode, onContactClick }: ContactsListProps) {
  const navigate = useNavigate();
  
  const handleContactClick = (id: string) => {
    if (onContactClick) {
      onContactClick(id);
    }
    navigate(`/contacts/${id}`);
  };
  
  return viewMode === "grid" ? (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {contacts.map((contact) => (
        <ContactCard 
          key={contact.id} 
          contact={contact} 
          onClick={handleContactClick}
        />
      ))}
    </div>
  ) : (
    <ContactsTable 
      contacts={contacts} 
      onContactClick={handleContactClick} 
    />
  );
}
