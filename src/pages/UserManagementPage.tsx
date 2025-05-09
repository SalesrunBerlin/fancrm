
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTab } from "@/components/settings/UserManagementTab";
import { WorkspaceManagementTab } from "@/components/settings/WorkspaceManagementTab";

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<string>("users");

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        description="Create and manage users and workspaces"
        backTo="/settings"
      />
      
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UserManagementTab />
        </TabsContent>
        
        <TabsContent value="workspaces">
          <WorkspaceManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
