
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUserCreated: () => void;
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
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [showEmailField, setShowEmailField] = useState<boolean>(false);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data, error } = await supabase
          .from('workspaces')
          .select('id, name')
          .eq('owner_id', user?.id);
          
        if (error) throw error;
        setWorkspaces(data || []);
        if (data && data.length > 0) {
          setSelectedWorkspace(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      }
    };
    
    if (open) {
      fetchWorkspaces();
      // Generate a random password
      const randomPassword = Math.random().toString(36).slice(-8);
      setFormData(prev => ({ ...prev, password: randomPassword }));
    }
  }, [open, user]);
  
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
          workspace_id: selectedWorkspace,
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
            <Label htmlFor="workspace">Workspace</Label>
            <select 
              id="workspace"
              className="w-full p-2 border rounded-md"
              value={selectedWorkspace}
              onChange={handleWorkspaceChange}
            >
              {workspaces.map(workspace => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
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
          
          <div className="flex justify-end space-x-2 pt-4">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
