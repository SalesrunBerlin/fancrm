
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Account, Contact } from "@/lib/types/database";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGeocodeAddress } from '@/hooks/useGeocodeAddress';
import { toast } from 'sonner';

export function useAccountDetails(accountId: string | undefined) {
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast: uiToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { geocodeAddress } = useGeocodeAddress();

  // Helper function to check if address is complete
  const hasCompleteAddress = (account: Partial<Account>): boolean => {
    return Boolean(account.street && account.city && account.postal_code);
  };

  // Helper function to check if coordinates need updating
  const needsCoordinateUpdate = (account: Partial<Account>): boolean => {
    return hasCompleteAddress(account) && (!account.latitude || !account.longitude);
  };

  const fetchAccountDetails = async () => {
    if (!accountId) return;
    setIsLoading(true);
    
    try {
      console.log("Fetching account with ID:", accountId);
      
      // Check if the user is logged in
      if (!user) {
        toast.error("Error", {
          description: "Sie müssen angemeldet sein, um Accounts anzuzeigen"
        });
        navigate('/accounts');
        return;
      }
      
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*, contacts(*), profiles(first_name, last_name)')
        .eq('id', accountId)
        .eq('owner_id', user.id) // Only allow seeing own accounts
        .single();

      if (accountError) {
        console.error("Error fetching account:", accountError);
        
        // If no rows returned, it means the user doesn't own this account
        if (accountError.code === 'PGRST116') {
          toast.error("Zugriff verweigert", {
            description: "Sie haben keinen Zugriff auf diesen Account"
          });
          navigate('/accounts');
        } else {
          toast.error("Fehler", {
            description: "Account-Details konnten nicht geladen werden"
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
          // Add address fields
          street: accountData.street,
          city: accountData.city,
          postal_code: accountData.postal_code,
          country: accountData.country,
          latitude: accountData.latitude,
          longitude: accountData.longitude,
          // Add contacts
          contacts: accountData.contacts?.map((contact: any) => ({
            id: contact.id,
            firstName: contact.first_name,
            lastName: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            accountId: contact.account_id,
            createdAt: contact.created_at,
            updatedAt: contact.updated_at,
            ownerId: contact.owner_id
          }))
        };
        setAccount(transformedAccount);

        // Set owner name if profiles data exists
        if (accountData.profiles) {
          const { first_name, last_name } = accountData.profiles;
          setOwnerName(`${first_name} ${last_name}`.trim());
        }
      }

    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAccount = async (updatedAccount: Account) => {
    try {
      console.log("Updating account with data:", updatedAccount);
      
      // If we have a complete address, try to get coordinates
      let coordinates = null;
      if (hasCompleteAddress(updatedAccount)) {
        console.log("Getting coordinates for complete address");
        coordinates = await geocodeAddress(
          updatedAccount.street!,
          updatedAccount.postal_code!,
          updatedAccount.city!,
          updatedAccount.country || "Germany"
        );
      }

      // Prepare the update data
      const dbAccount = {
        name: updatedAccount.name,
        type: updatedAccount.type,
        website: updatedAccount.website,
        industry: updatedAccount.industry,
        street: updatedAccount.street,
        city: updatedAccount.city,
        postal_code: updatedAccount.postal_code,
        country: updatedAccount.country,
        // Include coordinates if we got them, or null if address is incomplete
        latitude: hasCompleteAddress(updatedAccount) ? coordinates?.latitude ?? null : null,
        longitude: hasCompleteAddress(updatedAccount) ? coordinates?.longitude ?? null : null
      };

      console.log("Saving to database:", dbAccount);
      
      const { error } = await supabase
        .from('accounts')
        .update(dbAccount)
        .eq('id', updatedAccount.id);

      if (error) throw error;

      // Update the local state with the new data including coordinates
      setAccount({
        ...updatedAccount,
        latitude: dbAccount.latitude,
        longitude: dbAccount.longitude
      });
      
      if (coordinates) {
        toast.success("Account updated", {
          description: "Address coordinates were successfully saved"
        });
      } else if (hasCompleteAddress(updatedAccount)) {
        toast.warning("Account updated", {
          description: "Address was saved but coordinates could not be determined"
        });
      } else {
        toast.success("Account updated", {
          description: "Account information was saved successfully"
        });
      }
    } catch (error: any) {
      console.error('Error updating account:', error);
      toast.error("Error", {
        description: error.message || "Failed to update account"
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
