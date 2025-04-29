
import { ObjectTypesList } from "@/components/settings/ObjectTypesList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function Settings() {
  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your application objects and fields"
      />
      
      <div className="space-y-6">
        {/* Object Types Section */}
        <Card>
          <CardHeader>
            <CardTitle>Objects</CardTitle>
          </CardHeader>
          <CardContent>
            <ObjectTypesList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
