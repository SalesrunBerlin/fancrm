
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionStats } from "@/components/admin/SessionStats";
import { useUserSessions } from "@/hooks/useUserSessions";
import { Progress } from "@/components/ui/progress";
import { Loader2, Activity, Clock, Users, Calendar, BarChart3, PieChart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPlsChrt, Pie, Cell } from "recharts";

export default function UserAnalyticsPage() {
  const { sessionStats, isLoadingStats } = useUserSessions();
  const [timeFrame, setTimeFrame] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  
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
    if (!sessionStats) return [];
    
    const roleMap = sessionStats.reduce((acc, user) => {
      const role = user.role || 'user';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(roleMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  // Filter data based on timeFrame
  const getFilteredData = () => {
    if (!sessionStats || timeFrame === 'all') return sessionStats;
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch(timeFrame) {
      case 'today':
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    return sessionStats.filter(stat => new Date(stat.last_login) >= cutoffDate);
  };
  
  const filteredData = useMemo(() => getFilteredData(), [sessionStats, timeFrame]);
  const mostActiveUsers = useMemo(() => getMostActiveUsers(), [filteredData]);
  const usersByRole = useMemo(() => getUsersByRole(), [filteredData]);
  
  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Benutzeranalysen" 
        description="Verfolgen Sie die Benutzerinteraktion und die Nutzungsstatistiken des Systems"
      />
      
      <div className="flex justify-end">
        <div className="w-[180px]">
          <Label htmlFor="timeframe" className="mb-1 block">Zeitraum</Label>
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger id="timeframe">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Zeitraum wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Zeit</SelectItem>
              <SelectItem value="today">Heute</SelectItem>
              <SelectItem value="week">Letzte Woche</SelectItem>
              <SelectItem value="month">Letzter Monat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Benutzersitzungen
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Benutzer gesamt</CardTitle>
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
                <CardTitle className="text-sm font-medium">Sitzungen gesamt</CardTitle>
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
                <CardTitle className="text-sm font-medium">Aktivitäten gesamt</CardTitle>
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
                <CardTitle className="text-sm font-medium">Ø Sitzungszeit</CardTitle>
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
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Aktivste Benutzer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !mostActiveUsers.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Benutzerdaten verfügbar
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mostActiveUsers.map(user => {
                      const maxActivities = mostActiveUsers[0]?.total_activities || 1;
                      const percentage = (user.total_activities / maxActivities) * 100;
                      
                      return (
                        <div key={user.email} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[200px]" title={user.email}>
                              {user.first_name} {user.last_name || user.email}
                            </span>
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
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Benutzer nach Rolle
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !usersByRole.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Rollendaten verfügbar
                  </div>
                ) : (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPlsChrt>
                        <Pie
                          data={usersByRole}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {usersByRole.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </RechartsPlsChrt>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Benutzeraktivitäten Verteilung
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !filteredData?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Aktivitätsdaten verfügbar
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredData.slice(0, 10)}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="email" tick={false} label="Benutzer" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => {
                        if (name === "total_sessions") return [`${value} Sitzungen`, "Sitzungen"];
                        if (name === "total_activities") return [`${value} Aktivitäten`, "Aktivitäten"];
                        return [value, name];
                      }} />
                      <Legend />
                      <Bar name="Sitzungen" dataKey="total_sessions" fill="#8884d8" />
                      <Bar name="Aktivitäten" dataKey="total_activities" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sessions">
          <SessionStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
