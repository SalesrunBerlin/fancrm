
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WorkspaceUser {
  id: string;
  workspace_id: string;
  user_id: string;
  can_create_objects: boolean;
  can_modify_objects: boolean;
  can_create_actions: boolean;
  can_manage_users: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    metadata_access: boolean;
    data_access: boolean;
    is_active: boolean;
  };
}

export interface CreateUserPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  workspace_id?: string;
  metadata_access?: boolean;
  data_access?: boolean;
}

export function useWorkspaceUsers(workspaceId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["workspace-users", workspaceId],
    queryFn: async (): Promise<WorkspaceUser[]> => {
      if (!workspaceId || !user) return [];

      // First get the workspace users
      const { data: workspaceUsers, error: usersError } = await supabase
        .from("workspace_users")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (usersError) {
        console.error("Error fetching workspace users:", usersError);
        throw usersError;
      }

      if (!workspaceUsers?.length) return [];

      // Then get the profiles for these users
      const userIds = workspaceUsers.map(u => u.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, metadata_access, data_access, is_active")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching user profiles:", profilesError);
        throw profilesError;
      }

      // Combine the data
      return workspaceUsers.map(wu => {
        const profile = profiles?.find(p => p.id === wu.user_id);
        return {
          ...wu,
          profile
        };
      });
    },
    enabled: !!workspaceId && !!user,
  });

  const createUser = useMutation({
    mutationFn: async (userData: CreateUserPayload) => {
      if (!user) throw new Error("User not authenticated");

      // Call the database function to create a user
      const { data, error } = await supabase.rpc('admin_create_user', {
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        workspace_id: userData.workspace_id || null,
        metadata_access: userData.metadata_access !== undefined ? userData.metadata_access : true,
        data_access: userData.data_access !== undefined ? userData.data_access : false
      });

      if (error) {
        console.error("Error creating user:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-users", workspaceId] });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create user: ${error.message}`);
    }
  });

  const updateUserPermissions = useMutation({
    mutationFn: async ({ 
      userId, 
      permissions 
    }: { 
      userId: string; 
      permissions: { 
        metadata_access?: boolean; 
        data_access?: boolean;
        can_create_objects?: boolean;
        can_modify_objects?: boolean;
        can_create_actions?: boolean;
        can_manage_users?: boolean;
      } 
    }) => {
      if (!user || !workspaceId) throw new Error("Missing user or workspace ID");

      // Update profile permissions
      if (permissions.metadata_access !== undefined || permissions.data_access !== undefined) {
        const profileUpdate: any = {};
        if (permissions.metadata_access !== undefined) {
          profileUpdate.metadata_access = permissions.metadata_access;
        }
        if (permissions.data_access !== undefined) {
          profileUpdate.data_access = permissions.data_access;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", userId);

        if (profileError) throw profileError;
      }

      // Update workspace_users permissions
      const workspaceUserUpdate: any = {};
      if (permissions.can_create_objects !== undefined) {
        workspaceUserUpdate.can_create_objects = permissions.can_create_objects;
      }
      if (permissions.can_modify_objects !== undefined) {
        workspaceUserUpdate.can_modify_objects = permissions.can_modify_objects;
      }
      if (permissions.can_create_actions !== undefined) {
        workspaceUserUpdate.can_create_actions = permissions.can_create_actions;
      }
      if (permissions.can_manage_users !== undefined) {
        workspaceUserUpdate.can_manage_users = permissions.can_manage_users;
      }

      if (Object.keys(workspaceUserUpdate).length > 0) {
        const { error: workspaceUserError } = await supabase
          .from("workspace_users")
          .update(workspaceUserUpdate)
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId);

        if (workspaceUserError) throw workspaceUserError;
      }

      return { userId, permissions };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-users", workspaceId] });
      toast.success("User permissions updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update permissions: ${error.message}`);
    }
  });

  const createInvitation = useMutation({
    mutationFn: async ({ 
      email, 
      metadata_access = true,
      data_access = false,
      expiry_days = 7
    }: {
      email: string;
      metadata_access?: boolean;
      data_access?: boolean;
      expiry_days?: number;
    }) => {
      if (!user || !workspaceId) throw new Error("Missing user or workspace ID");

      const { data, error } = await supabase.rpc('create_workspace_invitation', {
        workspace_id: workspaceId,
        email,
        metadata_access,
        data_access,
        expiry_days
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (token) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations", workspaceId] });
      
      // Generate invitation link
      const baseUrl = window.location.origin;
      const invitationLink = `${baseUrl}/register/${token}`;
      
      toast.success("Invitation created successfully", {
        description: "Copy this invitation link to share:",
        action: {
          label: "Copy Link",
          onClick: () => {
            navigator.clipboard.writeText(invitationLink);
            toast.success("Link copied to clipboard");
          }
        }
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to create invitation: ${error.message}`);
    }
  });

  return {
    users,
    isLoading,
    error,
    createUser,
    updateUserPermissions,
    createInvitation
  };
}
