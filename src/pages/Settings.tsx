
import { StatusList } from "@/components/settings/StatusList";
import { StatusForm } from "@/components/settings/StatusForm";
import { ObjectTypesList } from "@/components/settings/ObjectTypesList";
import { useDealStatuses } from "@/hooks/useDealStatuses";

export default function Settings() {
  const { dealStatuses, isLoading, createStatus, updateStatus, deleteStatus } = useDealStatuses();

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
            <StatusList 
              dealStatuses={dealStatuses || []}
              isLoading={isLoading}
              updateStatus={updateStatus}
              deleteStatus={deleteStatus}
            />
            <StatusForm 
              dealStatuses={dealStatuses || []}
              createStatus={createStatus}
              isPending={createStatus.isPending || false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
