
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceList } from "@/components/admin/WorkspaceList";

export function WorkspaceManagementTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspaces</CardTitle>
      </CardHeader>
      <CardContent>
        <WorkspaceList />
      </CardContent>
    </Card>
  );
}
