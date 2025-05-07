
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  token: string;
  expires_at: string;
  created_by: string;
  created_at: string;
  metadata_access: boolean;
  data_access: boolean;
  is_used: boolean;
  workspace?: {
    name: string;
    description: string | null;
    primary_color: string;
    welcome_message: string;
  };
}

export function useWorkspaceInvitations(workspaceId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading, error } = useQuery({
    queryKey: ["workspace-invitations", workspaceId],
    queryFn: async (): Promise<WorkspaceInvitation[]> => {
      if (!workspaceId || !user) return [];

      const { data, error } = await supabase
        .from("workspace_invitations")
        .select(`
          *,
          workspace:workspaces(name, description, primary_color, welcome_message)
        `)
        .eq("workspace_id", workspaceId)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching workspace invitations:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!workspaceId && !!user,
  });

  const deleteInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("workspace_invitations")
        .delete()
        .eq("id", invitationId)
        .eq("created_by", user.id);

      if (error) throw error;
      return invitationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations", workspaceId] });
      toast.success("Invitation deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete invitation: ${error.message}`);
    }
  });

  return {
    invitations,
    isLoading,
    error,
    deleteInvitation
  };
}

// Hook for public invitation validation
export function useInvitationByToken(token?: string) {
  return useQuery({
    queryKey: ["invitation", token],
    queryFn: async (): Promise<WorkspaceInvitation | null> => {
      if (!token) return null;

      const { data, error } = await supabase
        .from("workspace_invitations")
        .select(`
          *,
          workspace:workspaces(name, description, primary_color, welcome_message)
        `)
        .eq("token", token)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found or expired
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!token,
  });
}
