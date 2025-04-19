
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Account, Contact } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Edit, X } from "lucide-react";

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAccount, setEditedAccount] = useState<Partial<Account>>({});

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!id) return;

      // Fetch account details
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

      // Fetch contacts for this account
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', id);

      if (accountError) {
        toast({
          title: "Fehler",
          description: "Account konnte nicht geladen werden",
          variant: "destructive"
        });
        return;
      }

      setAccount(accountData);
      setContacts(contactsData || []);
    };

    fetchAccountDetails();
  }, [id, toast]);

  const handleEdit = () => {
    if (account) {
      setEditedAccount({ ...account });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    const { error } = await supabase
      .from('accounts')
      .update(editedAccount)
      .eq('id', id);

    if (error) {
      toast({
        title: "Fehler",
        description: "Account konnte nicht aktualisiert werden",
        variant: "destructive"
      });
      return;
    }

    setAccount(prev => ({ ...prev, ...editedAccount } as Account));
    setIsEditing(false);
    toast({
      title: "Erfolg",
      description: "Account wurde aktualisiert"
    });
  };

  if (!account) return <div>Lädt...</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account Details</CardTitle>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button variant="outline" size="icon" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button onClick={handleSave}>Speichern</Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <strong>Name:</strong> {account.name}
              </div>
              <div>
                <strong>Typ:</strong> {account.type || 'Nicht angegeben'}
              </div>
              <div>
                <strong>Website:</strong> {account.website || 'Keine Website'}
              </div>
              <div>
                <strong>Branche:</strong> {account.industry || 'Nicht angegeben'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label>Name</label>
                <Input 
                  value={editedAccount.name || ''} 
                  onChange={(e) => setEditedAccount(prev => ({ ...prev, name: e.target.value }))} 
                />
              </div>
              <div>
                <label>Typ</label>
                <Input 
                  value={editedAccount.type || ''} 
                  onChange={(e) => setEditedAccount(prev => ({ ...prev, type: e.target.value }))} 
                />
              </div>
              <div>
                <label>Website</label>
                <Input 
                  value={editedAccount.website || ''} 
                  onChange={(e) => setEditedAccount(prev => ({ ...prev, website: e.target.value }))} 
                />
              </div>
              <div>
                <label>Branche</label>
                <Input 
                  value={editedAccount.industry || ''} 
                  onChange={(e) => setEditedAccount(prev => ({ ...prev, industry: e.target.value }))} 
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Kontakte</CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <ul>
              {contacts.map(contact => (
                <li key={contact.id} className="border-b py-2">
                  {contact.firstName} {contact.lastName} 
                  <span className="text-muted-foreground ml-2">
                    {contact.email}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Keine Kontakte für diesen Account</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

