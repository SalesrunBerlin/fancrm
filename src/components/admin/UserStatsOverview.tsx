
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { UserSummary } from "@/pages/admin/UserManagementPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserStatsOverviewProps {
  users: UserSummary[];
}

export function UserStatsOverview({ users }: UserStatsOverviewProps) {
  const [chartType, setChartType] = useState<'objects' | 'records'>('objects');
  
  // Prepare data for the charts
  const chartData = users.map(user => ({
    name: user.profile?.first_name ? `${user.profile.first_name} ${user.profile?.last_name || ''}` : user.email,
    objects: user.stats?.objectCount || 0,
    fields: user.stats?.fieldCount || 0,
    records: user.stats?.recordCount || 0,
  }));

  // Calculate totals for summary cards
  const totalObjects = users.reduce((sum, user) => sum + (user.stats?.objectCount || 0), 0);
  const totalFields = users.reduce((sum, user) => sum + (user.stats?.fieldCount || 0), 0);
  const totalRecords = users.reduce((sum, user) => sum + (user.stats?.recordCount || 0), 0);
  const totalUsers = users.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objects Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalObjects}</div>
            <p className="text-xs text-muted-foreground">
              Total objects across all users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fields Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFields}</div>
            <p className="text-xs text-muted-foreground">
              Total fields across all objects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">
              Total records across all objects
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Activity Distribution</CardTitle>
          <CardDescription>
            Distribution of objects and records across users
          </CardDescription>
          <TabsList>
            <TabsTrigger 
              value="objects" 
              onClick={() => setChartType('objects')}
              className={chartType === 'objects' ? 'bg-primary text-primary-foreground' : ''}
            >
              Objects
            </TabsTrigger>
            <TabsTrigger 
              value="records" 
              onClick={() => setChartType('records')}
              className={chartType === 'records' ? 'bg-primary text-primary-foreground' : ''}
            >
              Records
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {chartType === 'objects' ? (
                <Bar dataKey="objects" fill="#8884d8" name="Objects" />
              ) : (
                <Bar dataKey="records" fill="#82ca9d" name="Records" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
