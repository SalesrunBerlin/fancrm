
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Search, UserPlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUserEmails } from '@/hooks/useUserEmails';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WorkspaceUser {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  screen_name?: string;
  created_at: string;
}

interface WorkspaceUsersListProps {
  workspaceId: string;
}

export function WorkspaceUsersList({ workspaceId }: WorkspaceUsersListProps) {
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const { userEmails, isLoading: isLoadingEmails } = useUserEmails();

  useEffect(() => {
    fetchWorkspaceUsers();
  }, [workspaceId]);

  const fetchWorkspaceUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch workspace users
      const { data, error } = await supabase
        .from('workspace_users')
        .select(`
          id,
          user_id,
          workspace_id,
          role,
          created_at,
          profiles:user_id (
            email,
            first_name,
            last_name,
            screen_name
          )
        `)
        .eq('workspace_id', workspaceId);
      
      if (error) throw error;
      
      // Transform the data to match our WorkspaceUser interface
      const transformedUsers = data.map(item => {
        const profile = item.profiles as { 
          email?: string; 
          first_name?: string; 
          last_name?: string; 
          screen_name?: string; 
        };
        
        // Find the email from userEmails if profile doesn't have it
        let email = profile?.email || '';
        if (!email && userEmails) {
          const userEmail = userEmails.find(ue => ue.id === item.user_id);
          if (userEmail) {
            email = userEmail.email;
          }
        }
        
        return {
          id: item.user_id,
          email: email,
          role: item.role,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          screen_name: profile?.screen_name,
          created_at: item.created_at
        };
      });
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching workspace users:', error);
      toast.error('Failed to load workspace users');
    } finally {
      setLoading(false);
    }
  };

  const addUserToWorkspace = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      // Check if user is already in workspace
      const { data: existingUser } = await supabase
        .from('workspace_users')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', selectedUserId)
        .single();
      
      if (existingUser) {
        toast.error('User is already in this workspace');
        return;
      }

      // Add user to workspace
      const { error } = await supabase
        .from('workspace_users')
        .insert({
          workspace_id: workspaceId,
          user_id: selectedUserId,
          role: selectedRole
        });
      
      if (error) throw error;
      
      toast.success('User added to workspace');
      setAddUserDialogOpen(false);
      fetchWorkspaceUsers();
    } catch (error) {
      console.error('Error adding user to workspace:', error);
      toast.error('Failed to add user to workspace');
    }
  };

  const removeUserFromWorkspace = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_users')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      toast.success('User removed from workspace');
      fetchWorkspaceUsers();
    } catch (error) {
      console.error('Error removing user from workspace:', error);
      toast.error('Failed to remove user from workspace');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('workspace_users')
        .update({ role: newRole })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      toast.success('User role updated');
      fetchWorkspaceUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.screen_name && user.screen_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get available users (not already in workspace)
  const availableUsers = userEmails.filter(user => 
    !users.some(workspaceUser => workspaceUser.id === user.id)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Workspace Users</CardTitle>
        <Button onClick={() => setAddUserDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No users found in this workspace.
              </p>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {user.first_name ? user.first_name[0] : user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}` 
                          : user.screen_name || user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      defaultValue={user.role}
                      onValueChange={(value) => updateUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeUserFromWorkspace(user.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User to Workspace</DialogTitle>
              <DialogDescription>
                Select a user and assign a role to add them to this workspace.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user">User</Label>
                <Select 
                  value={selectedUserId} 
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingEmails ? (
                      <div className="flex justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={selectedRole} 
                  onValueChange={setSelectedRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addUserToWorkspace}>
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
