
import React, { useState } from "react";
import { useUserSessions, SessionStats } from "@/hooks/useUserSessions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SessionStats() {
  const { sessionStats, isLoadingStats } = useUserSessions();
  const [filter, setFilter] = useState("");
  const navigate = useNavigate();

  const filteredStats = sessionStats?.filter(
    (stat) =>
      stat.email.toLowerCase().includes(filter.toLowerCase()) ||
      `${stat.first_name || ''} ${stat.last_name || ''}`.toLowerCase().includes(filter.toLowerCase())
  );

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "N/A";
    
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          User Session Statistics
        </CardTitle>
        <CardDescription>
          Overview of user session data and activity metrics
        </CardDescription>
        <div className="pt-4">
          <Label htmlFor="filter">Filter Users</Label>
          <Input
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by email or name..."
            className="mt-1"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingStats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filteredStats?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No session data found
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Activities</TableHead>
                  <TableHead>Avg. Session</TableHead>
                  <TableHead>Total Time</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStats.map((stat) => (
                  <TableRow key={stat.email}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{stat.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {stat.first_name} {stat.last_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{stat.role || "user"}</div>
                    </TableCell>
                    <TableCell>{stat.total_sessions}</TableCell>
                    <TableCell>{stat.total_activities}</TableCell>
                    <TableCell>
                      {formatDuration(stat.avg_session_duration)}
                    </TableCell>
                    <TableCell>
                      {formatDuration(stat.total_duration_seconds)}
                    </TableCell>
                    <TableCell>
                      {new Date(stat.last_login).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            ...
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/admin/users/activity/${stat.email}`)}>
                            View Activity
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/users/sessions/${stat.email}`)}>
                            View Sessions
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
