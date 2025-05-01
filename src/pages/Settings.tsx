
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        description="Manage your application settings"
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Link to="/settings/object-manager">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle>Object Manager</CardTitle>
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
        
        {/* Placeholder for future setting sections */}
        <Card className="h-full opacity-60">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage users and permissions (Coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Control who can access your application and what they can do.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
