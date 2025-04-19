
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Account, Contact } from "@/lib/types/database";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function useAccountDetails(accountId: string | undefined) {
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchAccountDetails = async () => {
    if (!accountId) return;
    setIsLoading(true);
    
    try {
      console.log("Fetching account with ID:", accountId);
      
      // Check if the user is logged in
      if (!user) {
        toast({
          title: "Fehler",
          description: "Sie müssen angemeldet sein, um Accounts anzuzeigen",
          variant: "destructive"
        });
        navigate('/accounts');
        return;
      }
      
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*, profiles(first_name, last_name)')
        .eq('id', accountId)
        .eq('owner_id', user.id) // Only allow seeing own accounts
        .single();

      if (accountError) {
        console.error("Error fetching account:", accountError);
        
        // If no rows returned, it means the user doesn't own this account
        if (accountError.code === 'PGRST116') {
          toast({
            title: "Zugriff verweigert",
            description: "Sie haben keinen Zugriff auf diesen Account",
            variant: "destructive"
          });
          navigate('/accounts');
        } else {
          toast({
            title: "Fehler",
            description: "Account-Details konnten nicht geladen werden",
            variant: "destructive"
          });
        }
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

        // Set owner name if profiles data exists
        if (accountData.profiles) {
          const { first_name, last_name } = accountData.profiles;
          setOwnerName(`${first_name} ${last_name}`.trim());
        }
      }

      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', accountId);

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
    if (accountId) {
      fetchAccountDetails();
    } else {
      setIsLoading(false);
    }
  }, [accountId, user]);

  return {
    account,
    contacts,
    ownerName,
    isLoading,
    fetchAccountDetails,
    setAccount
  };
}
