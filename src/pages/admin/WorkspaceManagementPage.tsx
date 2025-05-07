
import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Settings, Users } from "lucide-react";

export default function WorkspaceManagementPage() {
  const { user } = useAuth();
  const { workspaces, isLoading } = useWorkspaces();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Workspace Management" 
        description="Manage your workspace settings and users"
      />
      
      <div className="space-y-4">
        {workspaces?.map(workspace => (
          <Card key={workspace.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="flex justify-between items-center">
                <div>{workspace.name}</div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <p className="text-muted-foreground text-sm mt-1">{workspace.description || "No description provided."}</p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Input 
                      id="theme" 
                      value={workspace.theme || "default"} 
                      readOnly 
                      className="bg-muted/50 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Primary Color</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <div 
                        className="w-6 h-6 rounded border" 
                        style={{ backgroundColor: workspace.primary_color || "#3b82f6" }}
                      />
                      <Input 
                        id="color" 
                        value={workspace.primary_color || "#3b82f6"} 
                        readOnly 
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-base">Workspace Users</Label>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Invite User
                    </Button>
                  </div>
                  
                  <div className="bg-muted/30 rounded-md p-4 min-h-32 flex flex-col items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No users added to this workspace yet.</p>
                    <Button size="sm" variant="link" className="mt-2">
                      Invite users
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {!workspaces?.length && (
          <Card className="p-6 flex flex-col items-center justify-center min-h-[200px]">
            <Settings className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground mb-4">No workspaces found.</p>
            <Button>Create Workspace</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
