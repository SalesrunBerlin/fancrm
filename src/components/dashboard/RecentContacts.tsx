
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactType } from "@/types";

interface RecentContactsProps {
  contacts: ContactType[];
}

export function RecentContacts({ contacts }: RecentContactsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts && contacts.length > 0 ? (
            contacts.slice(0, 3).map((contact) => (
              <div key={contact.id} className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-beauty-light flex items-center justify-center text-beauty-dark font-medium mr-3">
                  {contact.firstName?.[0]}{contact.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                  <p className="text-sm text-muted-foreground">{contact.email}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No contacts found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
