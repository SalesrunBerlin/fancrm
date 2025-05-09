
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

interface Workspace {
  id: string;
  name: string;
}

export function CreateUserDialog({ open, onClose, onUserCreated }: CreateUserDialogProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    metadata_access: true,
    data_access: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [showEmailField, setShowEmailField] = useState<boolean>(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState<boolean>(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (open) {
      fetchWorkspaces();
      // Generate a random password
      const randomPassword = Math.random().toString(36).slice(-8);
      setFormData(prev => ({ ...prev, password: randomPassword }));
    }
  }, [open, user]);
  
  const fetchWorkspaces = async () => {
    try {
      setIsLoadingWorkspaces(true);
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('owner_id', user?.id);
        
      if (error) throw error;
      setWorkspaces(data || []);
      
      if (data && data.length > 0) {
        setSelectedWorkspace(data[0].id);
      } else {
        setSelectedWorkspace('');
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Workspaces konnten nicht geladen werden');
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWorkspace(e.target.value);
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Bitte geben Sie einen Workspace-Namen ein');
      return;
    }
    
    try {
      setIsCreatingWorkspace(true);
      
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: newWorkspaceName,
          description: 'Created from user management',
          owner_id: user?.id
        })
        .select();
      
      if (error) throw error;
      
      toast.success('Workspace erfolgreich erstellt');
      await fetchWorkspaces();
      
      if (data && data.length > 0) {
        setSelectedWorkspace(data[0].id);
      }
      
      setIsCreatingWorkspace(false);
      setNewWorkspaceName('');
      
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Workspace konnte nicht erstellt werden');
      setIsCreatingWorkspace(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);

      // Generate email from username if email is not provided
      const emailToUse = showEmailField && formData.email ? formData.email : `${formData.username}@workspace.local`;
      
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: emailToUse,
          password: formData.password,
          first_name: formData.username,
          last_name: '',
          workspace_id: selectedWorkspace || undefined, // Send undefined if empty to let the function handle it
          metadata_access: formData.metadata_access,
          data_access: formData.data_access
        }
      });
      
      if (error) throw error;
      
      toast.success("User created successfully", {
        description: `Username: ${formData.username} with password: ${formData.password}`
      });
      
      onUserCreated();
      onClose();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error("Error creating user", {
        description: error.message || "Please try again"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="show_email"
              checked={showEmailField}
              onCheckedChange={setShowEmailField}
            />
            <Label htmlFor="show_email">Add custom email address</Label>
          </div>
          
          {showEmailField && (
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                If left empty, an email will be generated from the username
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                name="password"
                type="text"
                value={formData.password}
                onChange={handleChange}
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const randomPassword = Math.random().toString(36).slice(-8);
                  setFormData(prev => ({ ...prev, password: randomPassword }));
                }}
              >
                Generate
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace {isLoadingWorkspaces && <Loader2 className="inline h-4 w-4 animate-spin" />}</Label>
            {workspaces.length > 0 ? (
              <select 
                id="workspace"
                className="w-full p-2 border rounded-md"
                value={selectedWorkspace}
                onChange={handleWorkspaceChange}
              >
                <option value="">-- Select a workspace (optional) --</option>
                {workspaces.map(workspace => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            ) : !isLoadingWorkspaces ? (
              <Alert className="bg-muted mt-2">
                <AlertDescription>
                  No workspaces found. A default workspace will be created automatically when you create a user.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
          
          {/* Add option to create a new workspace */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between items-center">
              <Label>Create New Workspace</Label>
              <Button 
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsCreatingWorkspace(!isCreatingWorkspace)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isCreatingWorkspace ? 'Cancel' : 'New'}
              </Button>
            </div>
            
            {isCreatingWorkspace && (
              <div className="flex gap-2 items-center mt-2">
                <Input
                  placeholder="Workspace Name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={createWorkspace}
                  disabled={!newWorkspaceName.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="metadata_access"
              checked={formData.metadata_access}
              onCheckedChange={(checked) => handleSwitchChange('metadata_access', checked)}
            />
            <Label htmlFor="metadata_access">Metadata access (Objects and fields)</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="data_access"
              checked={formData.data_access}
              onCheckedChange={(checked) => handleSwitchChange('data_access', checked)}
            />
            <Label htmlFor="data_access">Data access (Records)</Label>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
