
import { useState } from "react";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { ActivitiesList } from "@/components/activities/ActivitiesList";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActivities } from "@/hooks/useActivities";

export default function Activities() {
  const [showForm, setShowForm] = useState(false);
  const { activities, loading } = useActivities();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActivityCreated = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Meine Aktivitäten</h1>
        <Button onClick={() => setShowForm((v) => !v)} variant="outline" size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {showForm && (
        <div className="mb-2">
          <ActivityForm onSuccess={handleActivityCreated} />
        </div>
      )}
      {loading ? (
        <div className="text-center">Loading activities...</div>
      ) : (
        <ActivitiesList 
          activities={activities} 
          key={refreshKey}
          showAddButton={false}
        />
      )}
    </div>
  );
}
