
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useUserSessions } from "@/hooks/useUserSessions";
import { Loader2, ArrowLeft, Activity, AlignLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SessionActivitiesPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { getSessionActivities } = useUserSessions();
  const { data: activities, isLoading } = getSessionActivities(sessionId);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return '🔑';
      case 'logout':
        return '🚪';
      case 'object_create':
        return '📄';
      case 'object_update':
        return '📝';
      case 'object_delete':
        return '🗑️';
      case 'field_create':
      case 'field_update':
      case 'field_delete':
        return '🔧';
      case 'record_create':
        return '➕';
      case 'record_update':
        return '✏️';
      case 'record_delete':
        return '❌';
      case 'view_page':
        return '👁️';
      default:
        return '📊';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Session Activities"
        description="Detailed activity log for this user session"
        backTo="/admin/users"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Session Timeline
          </CardTitle>
          <CardDescription>
            Chronological record of all user actions in this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !activities?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              No activities recorded for this session
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Object Type</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="text-center text-xl">
                        {getActivityIcon(activity.activity_type)}
                      </TableCell>
                      <TableCell>
                        {new Date(activity.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.activity_type.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell>{activity.object_type || '-'}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <AlignLeft className="h-4 w-4 mr-1" /> View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Activity Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-4 gap-4">
                                <div className="font-medium">Activity ID</div>
                                <div className="col-span-3">{activity.id}</div>
                                
                                <div className="font-medium">Timestamp</div>
                                <div className="col-span-3">
                                  {new Date(activity.timestamp).toLocaleString()}
                                </div>
                                
                                <div className="font-medium">User</div>
                                <div className="col-span-3">{activity.user_email}</div>
                                
                                <div className="font-medium">Action</div>
                                <div className="col-span-3">{activity.action}</div>
                                
                                <div className="font-medium">Activity Type</div>
                                <div className="col-span-3">{activity.activity_type}</div>
                                
                                <div className="font-medium">Object Type</div>
                                <div className="col-span-3">{activity.object_type || '-'}</div>
                                
                                <div className="font-medium">Object ID</div>
                                <div className="col-span-3">{activity.object_id || '-'}</div>
                              </div>
                              
                              <div>
                                <div className="font-medium mb-2">JSON Details</div>
                                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                                  {JSON.stringify(activity.details, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
