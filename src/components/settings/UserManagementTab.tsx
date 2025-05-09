
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUserEmails } from "@/hooks/useUserEmails";
import { UserTable } from "@/components/admin/UserTable";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { UserSummary } from "@/pages/admin/UserManagementPage";

export function UserManagementTab() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const { userEmails, isLoading: isLoadingEmails, error: emailError } = useUserEmails();

  useEffect(() => {
    if (emailError) {
      console.error("Email loading error:", emailError);
      toast.error(`Error loading emails: ${emailError}`);
    }
  }, [emailError]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        console.log("Starting user data fetch process");
        
        // Fetch profiles which have user data
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, screen_name, email, created_at');
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        if (!profilesData) {
          console.log("No profile data returned");
          setUsers([]);
          return;
        }

        console.log(`Fetched ${profilesData.length} profiles`);
        
        // Enrich each profile with object counts
        const enrichedUsers = await Promise.all(
          profilesData.map(async (profile) => {
            // Find real email from our userEmails data (fallback if profile doesn't have email)
            const userEmailEntry = userEmails.find(ue => ue.id === profile.id);
            
            // Use profile email if available, otherwise fallback to auth email or default
            const email = profile.email || (userEmailEntry?.email || `user-${profile.id.substring(0, 8)}@example.com`);
            
            return {
              id: profile.id,
              email: email,
              created_at: profile.created_at,
              profile: {
                first_name: profile.first_name,
                last_name: profile.last_name,
                screen_name: profile.screen_name || profile.id.substring(0, 8),
                email: profile.email,
                role: profile.role
              }
            };
          })
        );
        
        setUsers(enrichedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error("Could not fetch user data");
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch users when we have emails data and not loading
    if (!isLoadingEmails) {
      console.log("Email data loaded, fetching users");
      fetchUsers();
    }
  }, [userEmails, isLoadingEmails]);

  const handleUserCreated = () => {
    // Reload the users list when a new user is created
    if (!isLoadingEmails) {
      setIsLoading(true);
      // Small delay to ensure the database has updated
      setTimeout(async () => {
        try {
          // Fetch profiles which have user data
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, role, screen_name, email, created_at');
          
          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            throw profilesError;
          }
          
          if (!profilesData) {
            console.log("No profile data returned");
            setUsers([]);
            return;
          }

          const enrichedUsers = await Promise.all(
            profilesData.map(async (profile) => {
              const userEmailEntry = userEmails.find(ue => ue.id === profile.id);
              const email = profile.email || (userEmailEntry?.email || `user-${profile.id.substring(0, 8)}@example.com`);
              
              return {
                id: profile.id,
                email: email,
                created_at: profile.created_at,
                profile: {
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                  screen_name: profile.screen_name || profile.id.substring(0, 8),
                  email: profile.email,
                  role: profile.role
                }
              };
            })
          );
          
          setUsers(enrichedUsers);
        } catch (error) {
          console.error('Error fetching users:', error);
          toast.error("Could not fetch user data");
        } finally {
          setIsLoading(false);
        }
      }, 500);
    }
  };

  if (isLoading || isLoadingEmails) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        <UserTable 
          users={users} 
          onCreateUser={() => setCreateUserDialogOpen(true)}
        />
        
        <CreateUserDialog
          open={createUserDialogOpen}
          onClose={() => setCreateUserDialogOpen(false)}
          onUserCreated={handleUserCreated}
        />
      </CardContent>
    </Card>
  );
}
