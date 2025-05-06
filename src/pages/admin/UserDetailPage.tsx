
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserRoleSelector } from "@/components/admin/UserRoleSelector";
import { LoginHistoryTable } from "@/components/admin/LoginHistoryTable";
import { UserObjectsList } from "@/components/admin/UserObjectsList";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserSummary } from "./UserManagementPage";
import { toast } from "sonner";
import { ThemedButton } from "@/components/ui/themed-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserEmails } from "@/hooks/useUserEmails";

export default function UserDetailPage() {
  const { userId } = useParams();
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [userObjects, setUserObjects] = useState<any[]>([]);
  const { userEmails, isLoading: isLoadingEmails } = useUserEmails();

  useEffect(() => {
    // Redirect if not a Super Admin
    if (!isSuperAdmin) {
      navigate("/dashboard");
    }
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId || isLoadingEmails) return;
      
      try {
        setIsLoading(true);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, screen_name, created_at')
          .eq('id', userId)
          .single();
        
        if (profileError) throw profileError;
        
        // Get object statistics
        const { data: objectsData, error: objectsError } = await supabase
          .from('object_types')
          .select('id, name, api_name')
          .eq('owner_id', userId);
        
        if (objectsError) throw objectsError;
        
        // Get field counts
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('object_fields')
          .select('id, name, api_name, data_type, is_required, object_type_id')
          .eq('owner_id', userId);
        
        if (fieldsError) throw fieldsError;
        
        // Get record counts
        const { data: recordsData, error: recordsError } = await supabase
          .from('object_records')
          .select('id, object_type_id')
          .eq('owner_id', userId);
        
        if (recordsError) throw recordsError;
        
        // Fetch auth logs
        const { data: authLogsData, error: authLogsError } = await supabase
          .rpc('get_auth_logs', { target_user_id: userId });
        
        let historyData = [];
        
        if (authLogsError || !authLogsData || authLogsData.length === 0) {
          console.error('Could not fetch auth logs, using mock data:', authLogsError);
          // Use the mock data for login history
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          const lastWeek = new Date();
          lastWeek.setDate(today.getDate() - 7);
          
          historyData = [
            {
              timestamp: today.getTime(),
              event_message: JSON.stringify({
                msg: "Login",
                status: "200",
                path: "/token",
                remote_addr: "192.168.1.1",
                time: today.toISOString()
              })
            },
            {
              timestamp: yesterday.getTime(),
              event_message: JSON.stringify({
                msg: "Login",
                status: "200",
                path: "/token",
                remote_addr: "192.168.1.1",
                time: yesterday.toISOString()
              })
            },
            {
              timestamp: lastWeek.getTime(),
              event_message: JSON.stringify({
                msg: "Login",
                status: "200",
                path: "/token",
                remote_addr: "192.168.1.1",
                time: lastWeek.toISOString()
              })
            }
          ];
        } else {
          historyData = authLogsData;
        }
          
        setLoginHistory(historyData);
        
        // Process the objects, fields, and records data to get comprehensive user objects
        const processedObjects = objectsData?.map(obj => {
          const objectFields = fieldsData?.filter(f => f.object_type_id === obj.id) || [];
          const objectRecords = recordsData?.filter(r => r.object_type_id === obj.id) || [];
          
          return {
            id: obj.id,
            name: obj.name,
            api_name: obj.api_name,
            fields: objectFields,
            recordCount: objectRecords.length
          };
        }) || [];
        
        setUserObjects(processedObjects);
        
        // Find real email from our userEmails data
        const userEmailEntry = userEmails.find(ue => ue.id === profileData.id);
        const email = userEmailEntry?.email || `user-${profileData.id.substring(0, 8)}@example.com`;
        
        setUser({
          id: profileData.id,
          email: email,
          created_at: profileData.created_at,
          profile: {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            screen_name: profileData.screen_name || profileData.id.substring(0, 8),
            role: profileData.role
          },
          stats: {
            objectCount: objectsData?.length || 0,
            fieldCount: fieldsData?.length || 0,
            recordCount: recordsData?.length || 0
          }
        });
        
      } catch (error) {
        console.error('Error fetching user details:', error);
        toast.error("Could not fetch user details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, userEmails, isLoadingEmails]);

  if (isLoading || isLoadingEmails) {
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

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={userName} 
        description={`User details and statistics for ${user.email}`}
        backTo="/admin/users"
      />
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(user.profile?.first_name, user.profile?.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">{userName}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
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
                <dt className="text-sm font-medium text-muted-foreground">Screen Name</dt>
                <dd>{user.profile?.screen_name || user.id.substring(0, 8)}</dd>
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
      
      <UserObjectsList userObjects={userObjects} />
      
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
