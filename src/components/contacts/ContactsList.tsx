
import { Contact } from "@/lib/types/database";
import { ContactCard } from "./ContactCard";
import { ContactsTable } from "./ContactsTable";

interface ContactsListProps {
  contacts: Contact[];
  viewMode: "grid" | "table";
  onContactClick: (id: string) => void;
}

export function ContactsList({ contacts, viewMode, onContactClick }: ContactsListProps) {
  return viewMode === "grid" ? (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {contacts.map((contact) => (
        <ContactCard 
          key={contact.id} 
          contact={contact} 
          onClick={onContactClick}
        />
      ))}
    </div>
  ) : (
    <ContactsTable 
      contacts={contacts} 
      onContactClick={onContactClick} 
    />
  );
}
