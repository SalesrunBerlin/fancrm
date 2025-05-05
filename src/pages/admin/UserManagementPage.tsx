
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

export interface UserSummary {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
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
        
        // Fetch users with their profiles
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, created_at');
        
        if (usersError) throw usersError;
        
        // For each user, get their authentication info
        const enrichedUsers = await Promise.all(
          usersData.map(async (profile) => {
            // Get auth user data
            const { data: userData, error: userError } = await supabase
              .from('auth_users_view')
              .select('email, created_at, last_sign_in_at')
              .eq('id', profile.id)
              .single();
            
            // Get object counts
            const { data: objectsCount, error: objectsError } = await supabase
              .from('object_types')
              .select('id', { count: 'exact', head: true })
              .eq('owner_id', profile.id);
            
            // Get field counts
            const { data: fieldsCount, error: fieldsError } = await supabase
              .from('object_fields')
              .select('id', { count: 'exact', head: true })
              .eq('owner_id', profile.id);
            
            // Get record counts
            const { data: recordsCount, error: recordsError } = await supabase
              .from('object_records')
              .select('id', { count: 'exact', head: true })
              .eq('owner_id', profile.id);
            
            return {
              id: profile.id,
              email: userData?.email || 'Unknown',
              created_at: userData?.created_at || profile.created_at,
              last_sign_in_at: userData?.last_sign_in_at,
              profile: {
                first_name: profile.first_name,
                last_name: profile.last_name,
                role: profile.role
              },
              stats: {
                objectCount: objectsCount?.count || 0,
                fieldCount: fieldsCount?.count || 0,
                recordCount: recordsCount?.count || 0
              }
            };
          })
        );
        
        setUsers(enrichedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading) {
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
