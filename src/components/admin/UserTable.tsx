
import { useState } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { UserSummary } from "@/pages/admin/UserManagementPage";
import { ThemedButton } from "@/components/ui/themed-button";
import { Eye, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserTableProps {
  users: UserSummary[];
}

export function UserTable({ users }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.profile?.first_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.profile?.last_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.profile?.screen_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Screen Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Objects</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                  No users found matching your search
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(user.profile?.first_name, user.profile?.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {user.profile?.first_name || ''} {user.profile?.last_name || ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email || user.id.substring(0, 8) + '@example.com'}</TableCell>
                  <TableCell>{user.profile?.screen_name || user.id.substring(0, 8)}</TableCell>
                  <TableCell>{user.profile?.role || 'user'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{user.stats?.objectCount || 0}</TableCell>
                  <TableCell>{user.stats?.recordCount || 0}</TableCell>
                  <TableCell>
                    <ThemedButton size="sm" variant="outline" asChild>
                      <Link to={`/admin/users/${user.id}`}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Link>
                    </ThemedButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
