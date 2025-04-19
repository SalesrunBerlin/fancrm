
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Account } from "@/lib/types/database";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountDetailInfo } from '@/components/accounts/AccountDetailInfo';
import { AccountContacts } from '@/components/accounts/AccountContacts';
import { useAccountDetails } from '@/hooks/useAccountDetails';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { account, contacts, isLoading, fetchAccountDetails, setAccount } = useAccountDetails(id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAccount, setEditedAccount] = useState<Partial<Account>>({});
  const [showContactForm, setShowContactForm] = useState(false);

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
        onEdit={() => {
          setEditedAccount({
            name: account.name,
            type: account.type,
            website: account.website,
            industry: account.industry
          });
          setIsEditing(true);
        }}
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
