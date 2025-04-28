
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your CRM</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your custom CRM solution is ready. You can create and manage your own
              object types and records.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
