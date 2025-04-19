import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Account, Contact } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Edit, X, RefreshCw } from "lucide-react";
import { CreateContactForm } from '@/components/contacts/CreateContactForm';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAccount, setEditedAccount] = useState<Partial<Account>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);

  const fetchAccountDetails = async () => {
    if (!id) return;
    
    setIsLoading(true);
    
    try {
      console.log("Fetching account with ID:", id);
      
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (accountError) {
        console.error("Error fetching account:", accountError);
        toast({
          title: "Error",
          description: "Could not load account details",
          variant: "destructive"
        });
        return;
      }

      if (accountData) {
        console.log("Account data retrieved:", accountData);
        const transformedAccount: Account = {
          id: accountData.id,
          name: accountData.name,
          type: accountData.type,
          website: accountData.website,
          industry: accountData.industry,
          createdAt: accountData.created_at,
          updatedAt: accountData.updated_at,
          ownerId: accountData.owner_id,
        };
        setAccount(transformedAccount);
        setEditedAccount(transformedAccount);
      }

      console.log("Fetching contacts for account ID:", id);
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', id);

      if (contactsError) {
        console.error("Error fetching contacts:", contactsError);
      }

      if (contactsData) {
        console.log("Contacts retrieved:", contactsData);
        const transformedContacts: Contact[] = contactsData.map(contact => ({
          id: contact.id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          accountId: contact.account_id,
          createdAt: contact.created_at,
          updatedAt: contact.updated_at,
          ownerId: contact.owner_id
        }));
        setContacts(transformedContacts);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountDetails();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: editedAccount.name,
          type: editedAccount.type,
          website: editedAccount.website,
          industry: editedAccount.industry
        })
        .eq('id', id);

      if (error) {
        console.error("Error updating account:", error);
        toast({
          title: "Error",
          description: "Account could not be updated",
          variant: "destructive"
        });
        return;
      }

      setAccount(prev => ({ ...prev, ...editedAccount } as Account));
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Account updated successfully"
      });
    } catch (err) {
      console.error("Unexpected error during save:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleContactClick = (contactId: string) => {
    navigate(`/contacts/${contactId}`);
  };

  if (isLoading) return (
    <div className="container mx-auto p-4 flex justify-center items-center h-64">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!account) return (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent className="pt-6">
          <p>Account not found</p>
          <Button onClick={() => navigate('/accounts')} className="mt-4">Back to accounts</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account Details</CardTitle>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button onClick={handleSave}>Save</Button>
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
                <strong>Type:</strong> {account.type || 'Not specified'}
              </div>
              <div>
                <strong>Website:</strong> {account.website || 'No website'}
              </div>
              <div>
                <strong>Industry:</strong> {account.industry || 'Not specified'}
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
                <label>Type</label>
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
                <label>Industry</label>
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
          <div className="flex justify-between items-center">
            <CardTitle>Contacts</CardTitle>
            <Button onClick={() => setShowContactForm(true)} className="bg-beauty hover:bg-beauty-dark">
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {showContactForm && account && (
              <>
                <CreateContactForm 
                  accountId={account.id} 
                  onContactCreated={() => {
                    fetchAccountDetails();
                    setShowContactForm(false);
                  }}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setShowContactForm(false)} 
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
                    onClick={() => handleContactClick(contact.id)}
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
    </div>
  );
}
