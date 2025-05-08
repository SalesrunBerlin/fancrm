
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceSettings } from "@/components/admin/WorkspaceSettings";
import { WorkspaceUsersList } from "@/components/admin/WorkspaceUsersList";
import { WorkspaceList } from "@/components/admin/WorkspaceList";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AdminWorkspacePage() {
  const { isSuperAdmin } = useAuth();
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [workspace, setWorkspace] = useState<any>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // If we have a specific workspace ID, fetch its details
    if (workspaceId) {
      const fetchWorkspaceDetails = async () => {
        try {
          setIsLoading(true);
          const { data, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', workspaceId)
            .single();
            
          if (error) throw error;
          setWorkspace(data);
        } catch (error) {
          console.error('Error fetching workspace:', error);
          // Navigate to the workspace list page if there's an error
          navigate('/admin/workspace');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchWorkspaceDetails();
    } else {
      // If no specific workspace ID, show the list of workspaces
      setIsLoading(false);
    }
  }, [workspaceId, navigate]);
  
  // Redirect if not admin
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show the list of all workspaces if no specific workspace is selected
  if (!workspaceId) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Workspaces" 
          description="Verwalten Sie Ihre Workspaces und deren Benutzer"
        />
        <WorkspaceList />
      </div>
    );
  }
  
  // Show details for a specific workspace
  return (
    <div className="space-y-6">
      <PageHeader 
        title={workspace?.name || "Workspace-Einstellungen"} 
        description="Bearbeiten Sie die Einstellungen für Ihren Workspace und konfigurieren Sie die Benutzer"
      />
      
      {workspace ? (
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
            <TabsTrigger value="users">Benutzer</TabsTrigger>
            <TabsTrigger value="invitations">Einladungen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="mt-4">
            <WorkspaceSettings workspaceId={workspace.id} />
          </TabsContent>
          
          <TabsContent value="users" className="mt-4">
            <WorkspaceUsersList workspaceId={workspace.id} />
          </TabsContent>
          
          <TabsContent value="invitations" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Hier können Sie Benutzer-Einladungen für diesen Workspace verwalten.
                  Diese Funktionalität wird in Kürze implementiert.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p>Workspace nicht gefunden.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
