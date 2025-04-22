
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

  const updateAccountGeocode = async (account: Account) => {
    if (!account.street || !account.city || !account.postal_code || !account.country) return;

    const address = `${account.street}, ${account.postal_code} ${account.city}, ${account.country}`;
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbG4xbWV2azQwMjd4MnFsdG41Z2l0djZhIn0.YF-MD7OxJhXCAX4rLKygtg`
    );

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      
      const { error } = await supabase
        .from('accounts')
        .update({ latitude, longitude })
        .eq('id', account.id);

      if (error) {
        console.error('Error updating coordinates:', error);
      } else {
        setAccount(prev => prev ? { ...prev, latitude, longitude } : null);
      }
    }
  };

  const updateAccount = async (updatedAccount: Account) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update(updatedAccount)
        .eq('id', updatedAccount.id);

      if (error) throw error;

      setAccount(updatedAccount);
      await updateAccountGeocode(updatedAccount);
      
      toast({
        title: "Success",
        description: "Account updated successfully",
      });
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive",
      });
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
    setAccount,
    updateAccount
  };
}
