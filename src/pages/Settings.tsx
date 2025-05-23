
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { AppWindow, Database, PlaySquare, Settings as SettingsIcon, List, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        description="Manage your application settings"
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/settings/object-manager">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Object Manager
              </CardTitle>
              <CardDescription>
                Define and customize your objects, fields, and relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage custom objects, add fields, and define how your data is structured.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/applications">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AppWindow className="h-5 w-5" />
                Applications
              </CardTitle>
              <CardDescription>
                Manage your applications and object assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and configure applications, and assign objects to specific applications.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/structures">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlaySquare className="h-5 w-5" />
                Structures
              </CardTitle>
              <CardDescription>
                Define and customize your data structures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and publish objects, and define relationships.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/actions">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Actions
              </CardTitle>
              <CardDescription>
                Manage your object actions and workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage actions for creating records, linking records, and mass updates.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/settings/user-management">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users and workspaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage users, assign them to workspaces, and control their permissions.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
