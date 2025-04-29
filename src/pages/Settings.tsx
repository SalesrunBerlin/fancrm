
import { ObjectTypesList } from "@/components/settings/ObjectTypesList";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      
      <div className="space-y-6">
        {/* Object Types Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Objects</h2>
          <ObjectTypesList />
        </div>
      </div>
    </div>
  );
}
