
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactType } from "@/types";
import { Link } from "react-router-dom";

interface RecentContactsProps {
  contacts: ContactType[];
}

export function RecentContacts({ contacts }: RecentContactsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Contacts</CardTitle>
        <Link to="/contacts" className="text-sm text-muted-foreground hover:text-primary">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts && contacts.length > 0 ? (
            contacts.slice(0, 3).map((contact) => (
              <Link key={contact.id} to={`/contacts/${contact.id}`}>
                <div className="flex items-center hover:bg-muted/50 p-2 rounded-lg transition-colors">
                  <div className="h-10 w-10 rounded-full bg-beauty-light flex items-center justify-center text-beauty-dark font-medium mr-3">
                    {contact.firstName?.[0]}{contact.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-muted-foreground">No contacts found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
