
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, PlusCircle } from "lucide-react";
import { CreateUserForm } from "@/components/user-management/CreateUserForm";
import { UsersList } from "@/components/user-management/UsersList";
import { WorkspaceSettings } from "@/components/user-management/WorkspaceSettings";
import { InviteUserForm } from "@/components/user-management/InviteUserForm";
import { InvitationsList } from "@/components/user-management/InvitationsList";

export default function WorkspaceManagementPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const { workspaces, isLoading } = useWorkspaces();
  const [activeTab, setActiveTab] = useState("users");
  
  const workspace = workspaces?.[0]; // Admin users typically only have one workspace

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You don't have permission to access this page.
              Only administrators can manage users and workspaces.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Workspace Management"
          description="Manage your workspace and users"
        />
        <Card className="w-full p-6">
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You don't have a workspace yet.
            </p>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Workspace Management"
        description="Manage your workspace, users, and permissions"
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="settings">Workspace Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <UsersList workspaceId={workspace.id} />
                </CardContent>
              </Card>
            </div>
            <div>
              <CreateUserForm workspaceId={workspace.id} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="invitations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Active Invitations</CardTitle>
                </CardHeader>
                <CardContent>
                  <InvitationsList workspaceId={workspace.id} />
                </CardContent>
              </Card>
            </div>
            <div>
              <InviteUserForm workspaceId={workspace.id} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="max-w-2xl">
            <WorkspaceSettings workspace={workspace} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
