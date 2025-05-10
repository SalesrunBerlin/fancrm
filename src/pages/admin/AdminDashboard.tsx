
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, HelpCircle, Users, BookOpen, Briefcase, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description={`Willkommen im Administrationsbereich, ${user?.email}`}
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/help-tabs">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Help Tab Management
              </CardTitle>
              <CardDescription>
                Manage help center tabs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create, edit, and organize tabs in the help center.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/help-content">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help Content Management
              </CardTitle>
              <CardDescription>
                Edit help content displayed in the help center
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Update, add or remove help content sections and articles for users.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/admin/users">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and edit user details, assign roles and monitor user activity.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/admin/workspace">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Workspace Management
              </CardTitle>
              <CardDescription>
                Manage workspace settings and users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure workspace settings, add and manage users, customize login experience.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/admin/analytics">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                User Analytics
              </CardTitle>
              <CardDescription>
                Track user activity and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View session statistics, user engagement metrics, and activity logs.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Card className="h-full opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure system-wide settings (Coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Adjust global application settings and default configurations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
