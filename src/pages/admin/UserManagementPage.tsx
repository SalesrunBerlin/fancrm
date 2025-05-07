
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTable } from "@/components/admin/UserTable";
import { UserStatsOverview } from "@/components/admin/UserStatsOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUserEmails } from "@/hooks/useUserEmails";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";

export interface UserSummary {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    screen_name?: string;
    email?: string;
    role?: string;
  };
  stats?: {
    objectCount: number;
    fieldCount: number;
    recordCount: number;
  };
}

export default function UserManagementPage() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const { userEmails, isLoading: isLoadingEmails, error: emailError } = useUserEmails();

  useEffect(() => {
    // Redirect if not a Super Admin
    if (!isSuperAdmin) {
      navigate("/dashboard");
      return;
    }

    // If there's an email error, show it
    if (emailError) {
      console.error("Email loading error:", emailError);
      toast.error(`Error loading emails: ${emailError}`);
    }
  }, [isSuperAdmin, navigate, emailError]);

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
        
        // Log the email data for debugging
        console.log("User emails data:", userEmails);
        
        // Enrich each profile with object counts
        const enrichedUsers = await Promise.all(
          profilesData.map(async (profile) => {
            // Find real email from our userEmails data (fallback if profile doesn't have email)
            const userEmailEntry = userEmails.find(ue => ue.id === profile.id);
            
            // Log the email match attempt
            console.log(`Looking for email for user ${profile.id}: `, 
                          userEmailEntry ? `Found: ${userEmailEntry.email}` : "Not found");
            
            // Use profile email if available, otherwise fallback to auth email or default
            const email = profile.email || (userEmailEntry?.email || `user-${profile.id.substring(0, 8)}@example.com`);
            
            // Get object counts
            const { data: objectsData } = await supabase
              .from('object_types')
              .select('id')
              .eq('owner_id', profile.id);
            
            // Get field counts
            const { data: fieldsData } = await supabase
              .from('object_fields')
              .select('id')
              .eq('owner_id', profile.id);
            
            // Get record counts
            const { data: recordsData } = await supabase
              .from('object_records')
              .select('id')
              .eq('owner_id', profile.id);
            
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
              },
              stats: {
                objectCount: objectsData?.length || 0,
                fieldCount: fieldsData?.length || 0,
                recordCount: recordsData?.length || 0
              }
            };
          })
        );
        
        console.log(`Processed ${enrichedUsers.length} users with emails`);
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
      setTimeout(() => {
        const fetchUsers = async () => {
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
                
                // Get object counts
                const { data: objectsData } = await supabase
                  .from('object_types')
                  .select('id')
                  .eq('owner_id', profile.id);
                
                // Get field counts
                const { data: fieldsData } = await supabase
                  .from('object_fields')
                  .select('id')
                  .eq('owner_id', profile.id);
                
                // Get record counts
                const { data: recordsData } = await supabase
                  .from('object_records')
                  .select('id')
                  .eq('owner_id', profile.id);
                
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
                  },
                  stats: {
                    objectCount: objectsData?.length || 0,
                    fieldCount: fieldsData?.length || 0,
                    recordCount: recordsData?.length || 0
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
        
        fetchUsers();
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
    <div className="space-y-6">
      <PageHeader 
        title="Benutzerverwaltung" 
        description="Verwalten Sie Benutzer, sehen Sie Statistiken ein und überwachen Sie Aktivitäten"
      />
      
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Benutzer</TabsTrigger>
          <TabsTrigger value="statistics">Statistiken</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Registrierte Benutzer ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable 
                users={users} 
                onCreateUser={() => setCreateUserDialogOpen(true)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistics">
          <UserStatsOverview users={users} />
        </TabsContent>
      </Tabs>

      <CreateUserDialog
        open={createUserDialogOpen}
        onClose={() => setCreateUserDialogOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
