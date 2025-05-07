
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  WorkspaceUser, 
  useWorkspaceUsers 
} from "@/hooks/useWorkspaceUsers";
import { Search, Edit, MoreVertical } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPermissionsForm } from "./UserPermissionsForm";

interface UsersListProps {
  workspaceId: string;
}

export function UsersList({ workspaceId }: UsersListProps) {
  const { users, isLoading, updateUserPermissions } = useWorkspaceUsers(workspaceId);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<WorkspaceUser | null>(null);

  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const firstName = user.profile?.first_name?.toLowerCase() || "";
    const lastName = user.profile?.last_name?.toLowerCase() || "";
    const email = user.profile?.email?.toLowerCase() || "";
    
    return (
      firstName.includes(searchLower) ||
      lastName.includes(searchLower) ||
      email.includes(searchLower)
    );
  });

  const handleToggleDataAccess = async (user: WorkspaceUser, value: boolean) => {
    await updateUserPermissions.mutateAsync({
      userId: user.user_id,
      permissions: { data_access: value }
    });
  };

  const handleToggleMetadataAccess = async (user: WorkspaceUser, value: boolean) => {
    await updateUserPermissions.mutateAsync({
      userId: user.user_id,
      permissions: { metadata_access: value }
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Metadata Access</TableHead>
              <TableHead>Data Access</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.profile?.first_name || ''} {user.profile?.last_name || ''}
                  </TableCell>
                  <TableCell>{user.profile?.email || ''}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={user.profile?.metadata_access || false} 
                      onCheckedChange={(value) => handleToggleMetadataAccess(user, value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={user.profile?.data_access || false} 
                      onCheckedChange={(value) => handleToggleDataAccess(user, value)}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Permissions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
            <DialogDescription>
              Update permissions for {editingUser?.profile?.first_name} {editingUser?.profile?.last_name}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserPermissionsForm 
              workspaceId={workspaceId}
              user={editingUser}
              onComplete={() => setEditingUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
