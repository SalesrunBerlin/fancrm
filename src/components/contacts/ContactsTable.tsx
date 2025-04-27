
import { Contact } from "@/lib/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ContactsTableProps {
  contacts: Contact[];
  onContactClick: (id: string) => void;
}

export function ContactsTable({ contacts, onContactClick }: ContactsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Account</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow 
              key={contact.id} 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => onContactClick(contact.id)}
            >
              <TableCell className="font-medium">
                {contact.firstName} {contact.lastName}
              </TableCell>
              <TableCell>{contact.email || "-"}</TableCell>
              <TableCell>{contact.phone || "-"}</TableCell>
              <TableCell>{contact.accountName || "-"}</TableCell>
            </TableRow>
          ))}
          {contacts.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                Keine Kontakte gefunden
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
