
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WorkspaceUser, useWorkspaceUsers } from "@/hooks/useWorkspaceUsers";
import { Loader2 } from "lucide-react";

interface UserPermissionsFormProps {
  workspaceId: string;
  user: WorkspaceUser;
  onComplete?: () => void;
}

export function UserPermissionsForm({ workspaceId, user, onComplete }: UserPermissionsFormProps) {
  const { updateUserPermissions } = useWorkspaceUsers(workspaceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissions, setPermissions] = useState({
    metadata_access: user.profile?.metadata_access || false,
    data_access: user.profile?.data_access || false,
    can_create_objects: user.can_create_objects || false,
    can_modify_objects: user.can_modify_objects || false,
    can_create_actions: user.can_create_actions || false,
    can_manage_users: user.can_manage_users || false,
  });

  const handleToggle = (field: string, value: boolean) => {
    setPermissions(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      await updateUserPermissions.mutateAsync({
        userId: user.user_id,
        permissions
      });
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error("Error updating user permissions:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Data Access</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="metadata_access" className="flex-1">
                Metadata Access
                <p className="text-xs text-muted-foreground">
                  Can access objects, fields, and actions
                </p>
              </Label>
              <Switch 
                id="metadata_access"
                checked={permissions.metadata_access}
                onCheckedChange={(value) => handleToggle("metadata_access", value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="data_access" className="flex-1">
                Data Access
                <p className="text-xs text-muted-foreground">
                  Can access records and data
                </p>
              </Label>
              <Switch 
                id="data_access"
                checked={permissions.data_access}
                onCheckedChange={(value) => handleToggle("data_access", value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Object Permissions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="can_create_objects" className="flex-1">
                Create Objects
                <p className="text-xs text-muted-foreground">
                  Can create new object types
                </p>
              </Label>
              <Switch 
                id="can_create_objects"
                checked={permissions.can_create_objects}
                onCheckedChange={(value) => handleToggle("can_create_objects", value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="can_modify_objects" className="flex-1">
                Modify Objects
                <p className="text-xs text-muted-foreground">
                  Can modify existing object types and fields
                </p>
              </Label>
              <Switch 
                id="can_modify_objects"
                checked={permissions.can_modify_objects}
                onCheckedChange={(value) => handleToggle("can_modify_objects", value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Action Permissions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="can_create_actions" className="flex-1">
                Create Actions
                <p className="text-xs text-muted-foreground">
                  Can create and modify actions
                </p>
              </Label>
              <Switch 
                id="can_create_actions"
                checked={permissions.can_create_actions}
                onCheckedChange={(value) => handleToggle("can_create_actions", value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">User Management</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="can_manage_users" className="flex-1">
                Manage Users
                <p className="text-xs text-muted-foreground">
                  Can invite and manage other users
                </p>
              </Label>
              <Switch 
                id="can_manage_users"
                checked={permissions.can_manage_users}
                onCheckedChange={(value) => handleToggle("can_manage_users", value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onComplete}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
