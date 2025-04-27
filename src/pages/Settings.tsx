
import { StatusList } from "@/components/settings/StatusList";
import { StatusForm } from "@/components/settings/StatusForm";
import { ObjectTypesList } from "@/components/settings/ObjectTypesList";

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

        {/* Deal Status Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Deal Statuses</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusList />
            <StatusForm />
          </div>
        </div>
      </div>
    </div>
  );
}
