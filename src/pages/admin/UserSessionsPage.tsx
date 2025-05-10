
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserSessions } from "@/hooks/useUserSessions";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Clock, Database } from "lucide-react";

export default function UserSessionsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { getUserSessions } = useUserSessions();
  const { data: sessions, isLoading } = getUserSessions(userId);

  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from('auth_users_view')
        .select('email')
        .eq('id', userId)
        .single();

      if (data) {
        setUserEmail(data.email);
      }
    };

    fetchUserEmail();
  }, [userId]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Active Session";
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Sessions for ${userEmail || userId}`}
        description="View session history and activity for this user"
        backTo="/admin/users"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            User Sessions
          </CardTitle>
          <CardDescription>
            All recorded login sessions for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !sessions?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              No sessions found for this user
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Login Time</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Logout Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {new Date(session.login_time).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(session.last_activity_time).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {session.logout_time
                          ? new Date(session.logout_time).toLocaleString()
                          : "Still Active"}
                      </TableCell>
                      <TableCell>
                        {formatDuration(session.session_duration_seconds)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.is_active ? "default" : "secondary"}>
                          {session.is_active ? "Active" : "Ended"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/sessions/${session.id}/activities`)}
                        >
                          <Database className="h-4 w-4 mr-1" />
                          View Activities
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
  );
}
