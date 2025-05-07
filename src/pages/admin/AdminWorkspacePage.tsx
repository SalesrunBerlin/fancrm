
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceSettings } from "@/components/admin/WorkspaceSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedButton } from "@/components/ui/themed-button";
import { supabase } from "@/integrations/supabase/client";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";

export default function AdminWorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<any>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin && !isSuperAdmin) {
      navigate("/dashboard");
      return;
    }
  }, [user, isAdmin, isSuperAdmin, navigate]);

  useEffect(() => {
    fetchWorkspace();
  }, [user]);

  const fetchWorkspace = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's workspace
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (workspaceError && workspaceError.code !== 'PGRST116') {
        throw workspaceError;
      }

      if (workspaceData) {
        setWorkspace(workspaceData);
        fetchWorkspaceUsers(workspaceData.id);
      } else {
        // Create a default workspace if none exists
        const { data: newWorkspace, error: createError } = await supabase
          .from('workspaces')
          .insert({
            name: `${user.email?.split('@')[0]}'s Workspace`,
            description: 'Default workspace',
            owner_id: user.id
          })
          .select()
          .single();

        if (createError) throw createError;
        
        setWorkspace(newWorkspace);
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
      toast.error("Fehler beim Laden des Workspaces");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceUsers = async (workspaceId: string) => {
    try {
      // Get users in this workspace
      const { data: userData, error: userError } = await supabase
        .from('workspace_users')
        .select(`
          user_id,
          profiles:user_id(
            id,
            email,
            first_name,
            last_name,
            screen_name,
            role
          )
        `)
        .eq('workspace_id', workspaceId);

      if (userError) throw userError;
      
      setWorkspaceUsers(userData.map(item => ({
        ...item.profiles,
        workspace_user_id: item.user_id
      })));
    } catch (error) {
      console.error('Error fetching workspace users:', error);
      toast.error("Fehler beim Laden der Workspace-Benutzer");
    }
  };

  const handleUserCreated = () => {
    if (workspace) {
      fetchWorkspaceUsers(workspace.id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Workspace-Verwaltung" 
        description="Verwalten Sie Ihren Workspace und Benutzer"
      />
      
      <div className="flex justify-end">
        <ThemedButton onClick={() => setCreateUserDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Benutzer hinzufügen
        </ThemedButton>
      </div>
      
      <Tabs defaultValue="settings">
        <TabsList className="mb-4">
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          <TabsTrigger value="users">Benutzer ({workspaceUsers.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings">
          {workspace && <WorkspaceSettings workspaceId={workspace.id} />}
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Workspace-Benutzer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rolle
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workspaceUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          Keine Benutzer gefunden
                        </td>
                      </tr>
                    ) : (
                      workspaceUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name || ''} {user.last_name || ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {user.role || 'Benutzer'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.id !== workspace.owner_id && (
                              <ThemedButton variant="outline" size="sm">
                                Bearbeiten
                              </ThemedButton>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <CreateUserDialog 
        open={createUserDialogOpen}
        onClose={() => setCreateUserDialogOpen(false)}
        onUserCreated={handleUserCreated}
        workspaceId={workspace?.id}
      />
    </div>
  );
}
