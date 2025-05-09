
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceList } from "@/components/admin/WorkspaceList";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function WorkspaceManagementTab() {
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspaces</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <WorkspaceList />
      </CardContent>
    </Card>
  );
}
