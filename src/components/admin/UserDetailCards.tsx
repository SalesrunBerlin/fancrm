
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRoleSelector } from "@/components/admin/UserRoleSelector";
import { ThemedButton } from "@/components/ui/themed-button";
import { UserSummary } from "../../pages/admin/UserManagementPage";

interface UserDetailCardsProps {
  user: UserSummary;
}

export function UserDetailCards({ user }: UserDetailCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd>{user.profile?.first_name || ''} {user.profile?.last_name || ''}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Registered</dt>
              <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last Login</dt>
              <dd>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Role</dt>
              <dd>
                <UserRoleSelector 
                  userId={user.id} 
                  currentRole={user.profile?.role || 'user'} 
                />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Objects Created</dt>
              <dd className="text-2xl font-bold">{user.stats?.objectCount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Fields Created</dt>
              <dd className="text-2xl font-bold">{user.stats?.fieldCount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Records Created</dt>
              <dd className="text-2xl font-bold">{user.stats?.recordCount}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ThemedButton className="w-full" variant="outline">
            Reset Password
          </ThemedButton>
          <ThemedButton className="w-full" variant="destructive">
            Disable Account
          </ThemedButton>
        </CardContent>
      </Card>
    </div>
  );
}
