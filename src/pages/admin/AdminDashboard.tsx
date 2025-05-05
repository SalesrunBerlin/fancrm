
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, HelpCircle, Users, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description={`Welcome to the admin area, ${user?.email}`}
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
        
        <Card className="h-full opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage users and roles (Coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and edit user details, assign roles and manage permissions.
            </p>
          </CardContent>
        </Card>
        
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
