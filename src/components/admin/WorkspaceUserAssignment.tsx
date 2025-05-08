
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  screen_name?: string;
}

interface WorkspaceUserAssignmentProps {
  workspaceId: string;
  onUserAssigned: () => void;
}

export function WorkspaceUserAssignment({ workspaceId, onUserAssigned }: WorkspaceUserAssignmentProps) {
  const { toast: legacyToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState({
    can_create_objects: true,
    can_modify_objects: false,
    can_manage_users: false, 
    can_create_actions: false
  });
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isDialogOpen) {
      fetchAvailableUsers();
    }
  }, [isDialogOpen]);

  const fetchAvailableUsers = async () => {
    try {
      setIsLoading(true);

      // Get users already in the workspace
      const { data: existingUsers, error: existingError } = await supabase
        .from('workspace_users')
        .select('user_id')
        .eq('workspace_id', workspaceId);

      if (existingError) throw existingError;

      const existingUserIds = existingUsers.map(item => item.user_id);
      
      // Get all users
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, screen_name');

      if (usersError) throw usersError;

      // Filter out users who are already in the workspace
      const filteredUsers = allUsers.filter(user => !existingUserIds.includes(user.id));
      
      setAvailableUsers(filteredUsers);
      
      // Reset form
      if (filteredUsers.length > 0) {
        setSelectedUserId(filteredUsers[0].id);
      } else {
        setSelectedUserId('');
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast('Fehler beim Laden der verfügbaren Benutzer');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (permission: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [permission]: !prev[permission] }));
  };

  const handleAssignUser = async () => {
    if (!selectedUserId) {
      toast('Bitte wählen Sie einen Benutzer aus');
      return;
    }

    try {
      setIsAssigning(true);
      
      // Create workspace user assignment
      const { error } = await supabase
        .from('workspace_users')
        .insert([
          {
            workspace_id: workspaceId,
            user_id: selectedUserId,
            can_create_objects: permissions.can_create_objects,
            can_modify_objects: permissions.can_modify_objects,
            can_manage_users: permissions.can_manage_users,
            can_create_actions: permissions.can_create_actions
          }
        ]);

      if (error) throw error;

      // Update user profile with workspace_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ workspace_id: workspaceId })
        .eq('id', selectedUserId);

      if (profileError) {
        console.warn('Could not update user profile with workspace_id:', profileError);
      }

      toast.success('Benutzer wurde dem Workspace zugeordnet');
      setIsDialogOpen(false);
      onUserAssigned();
    } catch (error) {
      console.error('Error assigning user to workspace:', error);
      toast.error('Fehler beim Zuordnen des Benutzers zum Workspace');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)} 
        variant="outline" 
        className="flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Bestehenden Benutzer hinzufügen
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Benutzer zum Workspace hinzufügen</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center py-6">
              <p>Keine verfügbaren Benutzer gefunden. Alle Benutzer sind bereits diesem Workspace zugeordnet.</p>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="mt-4">
                Schließen
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="user-select">Benutzer auswählen</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="Wählen Sie einen Benutzer" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.screen_name || user.email || user.id.substring(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Berechtigungen</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Objekte erstellen</h4>
                      <p className="text-sm text-muted-foreground">Kann neue Objekttypen erstellen</p>
                    </div>
                    <Switch
                      checked={permissions.can_create_objects}
                      onCheckedChange={() => handlePermissionChange('can_create_objects')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Objekte bearbeiten</h4>
                      <p className="text-sm text-muted-foreground">Kann bestehende Objekte modifizieren</p>
                    </div>
                    <Switch
                      checked={permissions.can_modify_objects}
                      onCheckedChange={() => handlePermissionChange('can_modify_objects')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Aktionen erstellen</h4>
                      <p className="text-sm text-muted-foreground">Kann Aktionen und Workflows erstellen</p>
                    </div>
                    <Switch
                      checked={permissions.can_create_actions}
                      onCheckedChange={() => handlePermissionChange('can_create_actions')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Benutzer verwalten</h4>
                      <p className="text-sm text-muted-foreground">Kann Benutzer zum Workspace einladen/hinzufügen</p>
                    </div>
                    <Switch
                      checked={permissions.can_manage_users}
                      onCheckedChange={() => handlePermissionChange('can_manage_users')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleAssignUser} disabled={isAssigning || !selectedUserId}>
                  {isAssigning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Benutzer hinzufügen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
