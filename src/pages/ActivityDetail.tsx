
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/hooks/useActivity";
import { ActivityDetailHeader } from "@/components/activities/ActivityDetailHeader";
import { ActivityDetailForm } from "@/components/activities/ActivityDetailForm";
import { ActivityDetailView } from "@/components/activities/ActivityDetailView";

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const { activity, loading, saving, handleFieldChange, handleStatusChange, saveActivity } = useActivity(id);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    const success = await saveActivity();
    if (success) {
      setIsEditing(false);
    }
  };

  if (loading) return <div>Laden...</div>;
  if (!activity) return <div>Keine Aktivität gefunden</div>;

  return (
    <div className="space-y-6 p-6">
      <ActivityDetailHeader 
        isEditing={isEditing}
        onBack={() => navigate(-1)}
        onEdit={() => setIsEditing(true)}
      />

      {isEditing ? (
        <ActivityDetailForm 
          activity={activity}
          onFieldChange={handleFieldChange}
          onStatusChange={handleStatusChange}
          onSubmit={handleUpdate}
          saving={saving}
        />
      ) : (
        <ActivityDetailView 
          activity={activity}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
