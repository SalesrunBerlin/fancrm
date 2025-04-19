
import { Contact } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { CreateContactForm } from '@/components/contacts/CreateContactForm';

interface AccountContactsProps {
  contacts: Contact[];
  accountId: string;
  showContactForm: boolean;
  onContactClick: (contactId: string) => void;
  onShowContactForm: () => void;
  onHideContactForm: () => void;
  onContactCreated: () => void;
}

export function AccountContacts({
  contacts,
  accountId,
  showContactForm,
  onContactClick,
  onShowContactForm,
  onHideContactForm,
  onContactCreated,
}: AccountContactsProps) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Contacts</CardTitle>
          <Button onClick={onShowContactForm} className="bg-beauty hover:bg-beauty-dark">
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showContactForm && (
            <>
              <CreateContactForm 
                accountId={accountId} 
                onContactCreated={() => {
                  onContactCreated();
                  onHideContactForm();
                }}
              />
              <Button 
                variant="outline" 
                onClick={onHideContactForm} 
                className="mt-4"
              >
                Cancel
              </Button>
            </>
          )}
          
          {contacts.length > 0 ? (
            <ul className="mt-6">
              {contacts.map(contact => (
                <li 
                  key={contact.id} 
                  className="border-b py-2 hover:bg-accent cursor-pointer px-2 rounded"
                  onClick={() => onContactClick(contact.id)}
                >
                  {contact.firstName} {contact.lastName} 
                  <span className="text-muted-foreground ml-2">
                    {contact.email}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-muted-foreground">No contacts for this account</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
