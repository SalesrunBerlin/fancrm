
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

export interface UserSummary {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    screen_name?: string;
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
  const { userEmails, isLoading: isLoadingEmails } = useUserEmails();

  useEffect(() => {
    // Redirect if not a Super Admin
    if (!isSuperAdmin) {
      navigate("/dashboard");
    }
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        
        // Fetch profiles which have user data
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, screen_name, created_at');
        
        if (profilesError) throw profilesError;
        
        if (!profilesData) {
          setUsers([]);
          return;
        }
        
        // Enrich each profile with object counts
        const enrichedUsers = await Promise.all(
          profilesData.map(async (profile) => {
            // Find real email from our userEmails data
            const userEmailEntry = userEmails.find(ue => ue.id === profile.id);
            const email = userEmailEntry?.email || `user-${profile.id.substring(0, 8)}@example.com`;
            
            // Get object counts
            const { data: objectsData, error: objectsError } = await supabase
              .from('object_types')
              .select('id')
              .eq('owner_id', profile.id);
            
            // Get field counts
            const { data: fieldsData, error: fieldsError } = await supabase
              .from('object_fields')
              .select('id')
              .eq('owner_id', profile.id);
            
            // Get record counts
            const { data: recordsData, error: recordsError } = await supabase
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

    // Only fetch users when we have emails data
    if (!isLoadingEmails) {
      fetchUsers();
    }
  }, [userEmails, isLoadingEmails]);

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
        title="User Management" 
        description="Manage users, view statistics, and monitor activity"
      />
      
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable users={users} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistics">
          <UserStatsOverview users={users} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
