
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ThemedButton } from '@/components/ui/themed-button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, UserPlus } from 'lucide-react';
import { WorkspaceInviteDialog } from './WorkspaceInviteDialog';
import { WorkspaceUserAssignment } from './WorkspaceUserAssignment';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  screen_name: string;
}

interface WorkspaceUser {
  id: string;
  user: UserProfile;
  can_modify_objects: boolean;
  can_create_objects: boolean;
  can_manage_users: boolean;
  can_create_actions: boolean;
}

interface WorkspaceUsersListProps {
  workspaceId: string;
}

export function WorkspaceUsersList({ workspaceId }: WorkspaceUsersListProps) {
  const { user } = useAuth();
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaceUsers();
  }, [workspaceId]);

  const fetchWorkspaceUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('workspace_users')
        .select(`
          id,
          can_modify_objects,
          can_create_objects,
          can_manage_users,
          can_create_actions,
          user:user_id(
            id,
            email:profiles!inner(email),
            first_name:profiles!inner(first_name),
            last_name:profiles!inner(last_name),
            screen_name:profiles!inner(screen_name)
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at');
        
      if (error) throw error;
      
      // Format data for display
      const formattedData = data?.map(item => ({
        id: item.id,
        user: {
          id: item.user.id,
          email: item.user.email?.[0]?.email || '',
          first_name: item.user.first_name?.[0]?.first_name || '',
          last_name: item.user.last_name?.[0]?.last_name || '',
          screen_name: item.user.screen_name?.[0]?.screen_name || item.user.id.substring(0, 8)
        },
        can_modify_objects: item.can_modify_objects || false,
        can_create_objects: item.can_create_objects || false,
        can_manage_users: item.can_manage_users || false,
        can_create_actions: item.can_create_actions || false,
      })) || [];

      setWorkspaceUsers(formattedData);
    } catch (error) {
      console.error('Error fetching workspace users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = async (userId: string, permission: string, value: boolean) => {
    setIsUpdating(userId);
    try {
      const { error } = await supabase
        .from('workspace_users')
        .update({ [permission]: value })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      setWorkspaceUsers(prev => 
        prev.map(wsUser => 
          wsUser.id === userId 
            ? { ...wsUser, [permission]: value } 
            : wsUser
        )
      );
      
      toast.success('Berechtigungen aktualisiert');
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Fehler beim Aktualisieren der Berechtigungen');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleInviteCreated = () => {
    setInviteDialogOpen(false);
    toast.success('Einladung wurde erstellt');
  };

  const handleUserAssigned = () => {
    fetchWorkspaceUsers();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Workspace-Benutzer</CardTitle>
        <div className="flex gap-2">
          <WorkspaceUserAssignment 
            workspaceId={workspaceId} 
            onUserAssigned={handleUserAssigned} 
          />
          <ThemedButton size="sm" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Benutzer einladen
          </ThemedButton>
        </div>
      </CardHeader>
      <CardContent>
        {workspaceUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Berechtigungen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspaceUsers.map((wsUser) => (
                  <TableRow key={wsUser.id}>
                    <TableCell className="font-medium">
                      {wsUser.user.first_name} {wsUser.user.last_name || ''}
                      <div className="text-xs text-muted-foreground">
                        {wsUser.user.screen_name}
                      </div>
                    </TableCell>
                    <TableCell>{wsUser.user.email}</TableCell>
                    <TableCell>
                      {isUpdating === wsUser.id ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`create-objects-${wsUser.id}`}
                              checked={wsUser.can_create_objects}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(wsUser.id, 'can_create_objects', checked)
                              }
                              disabled={wsUser.user.id === user?.id} // Can't change own permissions
                            />
                            <Label htmlFor={`create-objects-${wsUser.id}`}>
                              Objekte erstellen
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`modify-objects-${wsUser.id}`}
                              checked={wsUser.can_modify_objects}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(wsUser.id, 'can_modify_objects', checked)
                              }
                              disabled={wsUser.user.id === user?.id}
                            />
                            <Label htmlFor={`modify-objects-${wsUser.id}`}>
                              Objekte bearbeiten
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`create-actions-${wsUser.id}`}
                              checked={wsUser.can_create_actions}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(wsUser.id, 'can_create_actions', checked)
                              }
                              disabled={wsUser.user.id === user?.id}
                            />
                            <Label htmlFor={`create-actions-${wsUser.id}`}>
                              Aktionen erstellen
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`manage-users-${wsUser.id}`}
                              checked={wsUser.can_manage_users}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(wsUser.id, 'can_manage_users', checked)
                              }
                              disabled={wsUser.user.id === user?.id}
                            />
                            <Label htmlFor={`manage-users-${wsUser.id}`}>
                              Benutzer verwalten
                            </Label>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">Keine Benutzer diesem Workspace zugeordnet</p>
            <div className="flex justify-center gap-2">
              <WorkspaceUserAssignment 
                workspaceId={workspaceId} 
                onUserAssigned={handleUserAssigned} 
              />
              <ThemedButton onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Benutzer einladen
              </ThemedButton>
            </div>
          </div>
        )}
      </CardContent>
      
      <WorkspaceInviteDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        workspaceId={workspaceId}
        onInviteCreated={handleInviteCreated}
      />
    </Card>
  );
}
