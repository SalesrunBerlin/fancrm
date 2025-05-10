import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Activity, Mail, User, Lock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('auth.users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!userId && !!isSuperAdmin,
  });

  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ["admin-user-profile", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!userId && !!isSuperAdmin,
  });

  const { data: sessions, isLoading: isSessionsLoading, error: sessionsError } = useQuery({
    queryKey: ["admin-user-sessions", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('login_time', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!userId && !!isSuperAdmin,
  });

  const { data: activities, isLoading: isActivitiesLoading, error: activitiesError } = useQuery({
    queryKey: ["admin-user-activities", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!userId && !!isSuperAdmin,
  });

  if (isLoading || isProfileLoading || isSessionsLoading || isActivitiesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || profileError || sessionsError || activitiesError) {
    return (
      <div className="text-center text-red-500">
        Error: {error?.message || profileError?.message || sessionsError?.message || activitiesError?.message}
      </div>
    );
  }

  if (!user) {
    return <div className="text-center">User not found.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Details"
        description="Detailed information about a specific user"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            User Information
          </CardTitle>
          <CardDescription>
            Personal and account details of the user
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none">{profile?.first_name} {profile?.last_name}</h4>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-bold mb-1">Email</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                {user.email}
              </div>
            </div>
            <div>
              <div className="text-sm font-bold mb-1">Account Status</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Lock className="mr-2 h-4 w-4" />
                {user.email_confirmed_at ? (
                  <Badge variant="outline">Active</Badge>
                ) : (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-bold mb-1">Created At</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-bold mb-1">Last Sign In</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            User Sessions
          </CardTitle>
          <CardDescription>
            List of user sessions and login history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions && sessions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Login Time</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Logout Time</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.id}</TableCell>
                      <TableCell>{new Date(session.login_time).toLocaleString()}</TableCell>
                      <TableCell>{new Date(session.last_activity_time).toLocaleString()}</TableCell>
                      <TableCell>{session.logout_time ? new Date(session.logout_time).toLocaleString() : 'Active'}</TableCell>
                      <TableCell>{session.ip_address}</TableCell>
                      <TableCell>{session.user_agent}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No sessions found for this user.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            User Activities
          </CardTitle>
          <CardDescription>
            Recent activities performed by the user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities && activities.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Object Type</TableHead>
                    <TableHead>Object ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{activity.activity_type}</TableCell>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>{activity.object_type}</TableCell>
                      <TableCell>{activity.object_id}</TableCell>
                      <TableCell>{JSON.stringify(activity.details)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No activities found for this user.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
