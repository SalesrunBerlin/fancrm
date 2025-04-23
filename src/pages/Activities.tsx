
import { useState } from "react";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { ActivitiesList } from "@/components/activities/ActivitiesList";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Activities() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Meine Aktivitäten</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? "Abbrechen" : "Neuer Anruf"}
        </Button>
      </div>
      {showForm && (
        <div className="mb-2">
          <ActivityForm onSuccess={() => setShowForm(false)} />
        </div>
      )}
      <ActivitiesList />
    </div>
  );
}
