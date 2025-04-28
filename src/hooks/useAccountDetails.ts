
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface Deal {
  id: string;
  name: string;
  amount: number | null;
  status: string;
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  scheduledAt: string | null;
  status: string;
}

export interface AccountDetails {
  id: string;
  name: string;
  type: string | null;
  website: string | null;
  industry: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
}

export function useAccountDetails(accountId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: account, isLoading } = useQuery({
    queryKey: ["account", accountId],
    queryFn: async () => {
      if (!user) throw new Error("User must be logged in to fetch account details");

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", accountId)
        .eq("owner_id", user.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        website: data.website,
        industry: data.industry,
        street: data.street,
        city: data.city,
        postalCode: data.postal_code,
        country: data.country,
        contacts: [] as Contact[],
        deals: [] as Deal[],
        activities: [] as Activity[]
      };
    },
    enabled: !!user && !!accountId,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["account-contacts", accountId],
    queryFn: async () => {
      if (!user) throw new Error("User must be logged in to fetch contacts");

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("account_id", accountId)
        .eq("owner_id", user.id);

      if (error) throw error;

      return data.map(contact => ({
        id: contact.id,
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        phone: contact.phone,
      }));
    },
    enabled: !!user && !!accountId,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["account-deals", accountId],
    queryFn: async () => {
      return [] as Deal[];
    },
    enabled: false, // Temporarily disabled
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["account-activities", accountId],
    queryFn: async () => {
      return [] as Activity[];
    },
    enabled: false, // Temporarily disabled
  });

  const updateAccount = useMutation({
    mutationFn: async (data: Partial<AccountDetails>) => {
      if (!user) throw new Error("User must be logged in to update account");

      const { error } = await supabase
        .from("accounts")
        .update({
          name: data.name,
          type: data.type,
          website: data.website,
          industry: data.industry,
          street: data.street,
          city: data.city,
          postal_code: data.postalCode,
          country: data.country,
        })
        .eq("id", accountId)
        .eq("owner_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", accountId] });
      toast({
        title: "Success",
        description: "Account details updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    account: account ? {
      ...account,
      contacts,
      deals,
      activities,
    } : undefined,
    isLoading,
    updateAccount,
  };
}
