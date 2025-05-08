
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceSettings } from "@/components/admin/WorkspaceSettings";
import { WorkspaceUsersList } from "@/components/admin/WorkspaceUsersList";
import { WorkspaceInviteDialog } from "@/components/admin/WorkspaceInviteDialog";
import { Loader2 } from "lucide-react";

export default function AdminWorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [users, setUsers] = useState<any[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  useEffect(() => {
    // Simulated API call to get workspace data
    const fetchWorkspaceData = async () => {
      try {
        setIsLoading(true);
        // Simulated delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        setWorkspace({
          id: workspaceId || 'default-workspace',
          name: 'Default Workspace',
          description: 'This is the default workspace for all users.',
          theme: 'light',
          primaryColor: '#3b82f6',
          welcomeMessage: 'Welcome to the workspace!',
          registrationEnabled: true
        });
        
        setUsers([
          {
            id: '1',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'Admin'
          },
          {
            id: '2',
            email: 'manager@example.com',
            first_name: 'Manager',
            last_name: 'User',
            role: 'Manager'
          },
          {
            id: '3',
            email: 'user@example.com',
            first_name: 'Regular',
            last_name: 'User',
            role: 'User'
          }
        ]);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching workspace data:', error);
        setIsLoading(false);
      }
    };
    
    fetchWorkspaceData();
  }, [workspaceId]);

  const handleRemoveUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">{workspace?.name || 'Workspace'} Management</h1>
      
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Users</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkspaceUsersList 
                users={users} 
                onRemoveUser={handleRemoveUser}
                onInviteClick={() => setIsInviteDialogOpen(true)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="pt-4">
          {workspace && (
            <WorkspaceSettings 
              workspace={workspace}
              onUpdate={(updatedWorkspace) => {
                setWorkspace({ ...workspace, ...updatedWorkspace });
              }}
            />
          )}
        </TabsContent>
      </Tabs>
      
      <WorkspaceInviteDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        workspaceId={workspaceId || ''}
        onInvite={(email) => {
          console.log(`Invited: ${email}`);
          setIsInviteDialogOpen(false);
        }}
      />
    </div>
  );
}
