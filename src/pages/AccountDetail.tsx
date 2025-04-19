
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Account, Contact } from "@/lib/types/database";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountDetailInfo } from '@/components/accounts/AccountDetailInfo';
import { AccountContacts } from '@/components/accounts/AccountContacts';

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

      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', id);

      if (contactsError) {
        console.error("Error fetching contacts:", contactsError);
        return;
      }

      if (contactsData) {
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

  const handleEditFieldChange = (field: keyof Account, value: string) => {
    setEditedAccount(prev => ({ ...prev, [field]: value }));
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
      <AccountDetailInfo
        account={account}
        isEditing={isEditing}
        editedAccount={editedAccount}
        onEdit={() => setIsEditing(true)}
        onCancelEdit={() => setIsEditing(false)}
        onSave={handleSave}
        onEditFieldChange={handleEditFieldChange}
      />
      
      <AccountContacts
        contacts={contacts}
        accountId={account.id}
        showContactForm={showContactForm}
        onContactClick={(contactId) => navigate(`/contacts/${contactId}`)}
        onShowContactForm={() => setShowContactForm(true)}
        onHideContactForm={() => setShowContactForm(false)}
        onContactCreated={fetchAccountDetails}
      />
    </div>
  );
}
