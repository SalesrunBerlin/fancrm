
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionStats } from "@/components/admin/SessionStats";
import { useUserSessions } from "@/hooks/useUserSessions";
import { Progress } from "@/components/ui/progress";
import { Loader2, Activity, Clock, Users, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function UserAnalyticsPage() {
  const { sessionStats, isLoadingStats } = useUserSessions();
  const [timeFrame, setTimeFrame] = useState("all");
  
  // Calculate summary metrics
  const getTotalSessions = () => sessionStats?.reduce((sum, stat) => sum + stat.total_sessions, 0) || 0;
  const getTotalActivities = () => sessionStats?.reduce((sum, stat) => sum + stat.total_activities, 0) || 0;
  const getTotalUsers = () => sessionStats?.length || 0;
  const getAvgSessionTime = () => {
    if (!sessionStats?.length) return 0;
    const validDurations = sessionStats.filter(s => s.avg_session_duration !== null);
    if (!validDurations.length) return 0;
    return validDurations.reduce((sum, stat) => sum + (stat.avg_session_duration || 0), 0) / validDurations.length;
  };
  
  // Format duration in a human-readable way
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };
  
  // Get the most active users
  const getMostActiveUsers = () => {
    if (!sessionStats) return [];
    
    return [...sessionStats]
      .sort((a, b) => b.total_activities - a.total_activities)
      .slice(0, 5);
  };
  
  // Get active users distribution by role
  const getUsersByRole = () => {
    if (!sessionStats) return {};
    
    return sessionStats.reduce((acc, user) => {
      const role = user.role || 'user';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };
  
  const usersByRole = getUsersByRole();
  const mostActiveUsers = getMostActiveUsers();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Analytics" 
        description="Track user engagement and system usage statistics"
      />
      
      <div className="flex justify-end">
        <div className="w-[180px]">
          <Label htmlFor="timeframe" className="mb-1 block">Time Frame</Label>
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger id="timeframe">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{getTotalUsers()}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{getTotalSessions()}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{getTotalActivities()}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{formatDuration(getAvgSessionTime())}</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {mostActiveUsers.map(user => {
                  const maxActivities = mostActiveUsers[0]?.total_activities || 1;
                  const percentage = (user.total_activities / maxActivities) * 100;
                  
                  return (
                    <div key={user.email} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{user.email}</span>
                        <span className="font-medium">{user.total_activities}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(usersByRole).map(([role, count]) => {
                  const percentage = (count / getTotalUsers()) * 100;
                  
                  return (
                    <div key={role} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{role}</span>
                        <span className="font-medium">{count} users ({percentage.toFixed(0)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="sessions">
        <TabsList className="mb-4">
          <TabsTrigger value="sessions">User Sessions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sessions">
          <SessionStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
