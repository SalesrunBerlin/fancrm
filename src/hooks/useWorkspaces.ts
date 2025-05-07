
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  theme: string;
  primary_color: string;
  owner_id: string;
  is_active: boolean;
  registration_enabled: boolean;
  welcome_message: string;
  created_at: string;
  updated_at: string;
}

export function useWorkspaces() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: workspaces, isLoading, error } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async (): Promise<Workspace[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at");

      if (error) {
        console.error("Error fetching workspaces:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });

  const createWorkspace = useMutation({
    mutationFn: async (workspace: Partial<Workspace>) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("workspaces")
        .insert([{ ...workspace, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create workspace: ${error.message}`);
    },
  });

  const updateWorkspace = useMutation({
    mutationFn: async ({ 
      id, 
      ...changes 
    }: { id: string; [key: string]: any }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("workspaces")
        .update(changes)
        .eq("id", id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update workspace: ${error.message}`);
    },
  });

  return {
    workspaces,
    isLoading,
    error,
    createWorkspace,
    updateWorkspace,
  };
}
