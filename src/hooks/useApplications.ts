
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Application {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  owner_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface ApplicationFormData {
  name: string;
  description?: string;
  icon?: string;
}

export function useApplications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: applications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["applications"],
    queryFn: async (): Promise<Application[]> => {
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("owner_id", user.id)
        .order("is_default", { ascending: false })
        .order("name");
      
      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  const createApplication = useMutation({
    mutationFn: async (formData: ApplicationFormData) => {
      if (!user) {
        throw new Error("User must be logged in to create an application");
      }

      const { data, error } = await supabase
        .from("applications")
        .insert([
          {
            ...formData,
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({
        title: "Success",
        description: "Application created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create application: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    },
  });

  const updateApplication = useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: Partial<ApplicationFormData>;
    }) => {
      if (!user) {
        throw new Error("User must be logged in to update an application");
      }

      const { data, error } = await supabase
        .from("applications")
        .update(formData)
        .eq("id", id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update application: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    },
  });

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error("User must be logged in to delete an application");
      }

      // Check if this is the default application
      const app = applications?.find(a => a.id === id);
      if (app?.is_default) {
        throw new Error("Cannot delete the default application");
      }

      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);

      if (error) {
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete application: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    },
  });

  const setDefaultApplication = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error("User must be logged in to update an application");
      }

      // First, clear the default status from all applications
      const { error: clearError } = await supabase
        .from("applications")
        .update({ is_default: false })
        .eq("owner_id", user.id);

      if (clearError) {
        throw clearError;
      }

      // Set the new default application
      const { data, error } = await supabase
        .from("applications")
        .update({ is_default: true })
        .eq("id", id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({
        title: "Success",
        description: "Default application updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to set default application: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    },
  });

  return {
    applications,
    isLoading,
    error,
    refetch,
    createApplication,
    updateApplication,
    deleteApplication,
    setDefaultApplication,
  };
}
