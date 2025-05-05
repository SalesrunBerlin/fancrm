
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThemedButton } from "@/components/ui/themed-button";
import { UserRoleSelector } from "@/components/admin/UserRoleSelector";
import { LoginHistoryTable } from "@/components/admin/LoginHistoryTable";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserSummary } from "./UserManagementPage";
import { toast } from "sonner";

export default function UserDetailPage() {
  const { userId } = useParams();
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  useEffect(() => {
    // Redirect if not a Super Admin
    if (!isSuperAdmin) {
      navigate("/dashboard");
    }
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, created_at')
          .eq('id', userId)
          .single();
        
        if (profileError) throw profileError;
        
        // Fetch auth user data
        const { data: userData, error: userError } = await supabase
          .from('auth_users_view')
          .select('email, created_at, last_sign_in_at')
          .eq('id', userId)
          .single();
        
        if (userError) {
          console.warn('Could not fetch auth user data:', userError);
        }
        
        // Get object statistics
        const { data: objectsData, error: objectsError } = await supabase
          .from('object_types')
          .select('id, name, api_name, created_at')
          .eq('owner_id', userId);
        
        if (objectsError) throw objectsError;
        
        // Get field counts
        const { data: fieldsCount, error: fieldsError } = await supabase
          .from('object_fields')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', userId);
        
        // Get record counts
        const { data: recordsCount, error: recordsError } = await supabase
          .from('object_records')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', userId);
        
        // Get login history
        const { data: loginData, error: loginError } = await supabase
          .from('auth_logs_view')
          .select('timestamp, event_message')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(20);
        
        if (loginError) {
          console.warn('Could not fetch login history:', loginError);
        }
        
        setUser({
          id: profileData.id,
          email: userData?.email || 'Unknown',
          created_at: userData?.created_at || profileData.created_at,
          last_sign_in_at: userData?.last_sign_in_at,
          profile: {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            role: profileData.role
          },
          stats: {
            objectCount: objectsData?.length || 0,
            fieldCount: fieldsCount?.count || 0,
            recordCount: recordsCount?.count || 0
          }
        });
        
        setLoginHistory(loginData || []);
      } catch (error) {
        console.error('Error fetching user details:', error);
        toast.error("Could not fetch user details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Not Found" description="The requested user could not be found" />
        <ThemedButton asChild>
          <Link to="/admin/users">Back to Users</Link>
        </ThemedButton>
      </div>
    );
  }

  const userName = user.profile?.first_name && user.profile?.last_name
    ? `${user.profile.first_name} ${user.profile.last_name}`
    : user.email;

  return (
    <div className="space-y-6">
      <ThemedButton variant="outline" asChild>
        <Link to="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
      </ThemedButton>
      
      <PageHeader 
        title={userName} 
        description={`User details and statistics for ${user.email}`}
      />
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd>{user.profile?.first_name || ''} {user.profile?.last_name || ''}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Registered</dt>
                <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Login</dt>
                <dd>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Role</dt>
                <dd>
                  <UserRoleSelector 
                    userId={user.id} 
                    currentRole={user.profile?.role || 'user'} 
                  />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Objects Created</dt>
                <dd className="text-2xl font-bold">{user.stats?.objectCount}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Fields Created</dt>
                <dd className="text-2xl font-bold">{user.stats?.fieldCount}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Records Created</dt>
                <dd className="text-2xl font-bold">{user.stats?.recordCount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ThemedButton className="w-full" variant="outline">
              Reset Password
            </ThemedButton>
            <ThemedButton className="w-full" variant="destructive">
              Disable Account
            </ThemedButton>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>Recent login activity for this user</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginHistoryTable loginHistory={loginHistory} />
        </CardContent>
      </Card>
    </div>
  );
}
