
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UserAccessContextType {
  hasMetadataAccess: boolean;
  hasDataAccess: boolean;
  canCreateObjects: boolean;
  canModifyObjects: boolean;
  canCreateActions: boolean;
  canManageUsers: boolean;
  isLoading: boolean;
}

const UserAccessContext = createContext<UserAccessContextType>({
  hasMetadataAccess: false,
  hasDataAccess: false,
  canCreateObjects: false,
  canModifyObjects: false,
  canCreateActions: false,
  canManageUsers: false,
  isLoading: true,
});

export function UserAccessProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [permissions, setPermissions] = useState({
    hasMetadataAccess: false,
    hasDataAccess: false,
    canCreateObjects: false,
    canModifyObjects: false,
    canCreateActions: false,
    canManageUsers: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch user profile for metadata/data access
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("metadata_access, data_access")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw profileError;
        }

        // Fetch workspace permissions
        const { data: wsUserData, error: wsUserError } = await supabase
          .from("workspace_users")
          .select("can_create_objects, can_modify_objects, can_create_actions, can_manage_users")
          .eq("user_id", user.id)
          .single();

        if (wsUserError && wsUserError.code !== "PGRST116") { // PGRST116 is "no rows found"
          console.error("Error fetching workspace user:", wsUserError);
          throw wsUserError;
        }

        // Admins have all permissions by default
        if (isAdmin || isSuperAdmin) {
          setPermissions({
            hasMetadataAccess: true,
            hasDataAccess: true,
            canCreateObjects: true,
            canModifyObjects: true,
            canCreateActions: true,
            canManageUsers: true,
          });
        } else {
          // Regular users get permissions from their profile and workspace settings
          setPermissions({
            hasMetadataAccess: profileData?.metadata_access || false,
            hasDataAccess: profileData?.data_access || false,
            canCreateObjects: wsUserData?.can_create_objects || false,
            canModifyObjects: wsUserData?.can_modify_objects || false,
            canCreateActions: wsUserData?.can_create_actions || false,
            canManageUsers: wsUserData?.can_manage_users || false,
          });
        }
      } catch (error) {
        console.error("Error fetching user permissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPermissions();
  }, [user, isAdmin, isSuperAdmin]);

  return (
    <UserAccessContext.Provider value={{ ...permissions, isLoading }}>
      {children}
    </UserAccessContext.Provider>
  );
}

export const useUserAccess = () => useContext(UserAccessContext);
