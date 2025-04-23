
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  
  const { activity, loading, handleFieldChange, handleStatusChange } = useActivity(id);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    try {
      const { error } = await supabase
        .from("activities")
        .update({
          type: activity.type,
          subject: activity.subject,
          description: activity.description,
          scheduled_at: activity.scheduled_at,
          end_time: activity.end_time,
          outcome: activity.outcome,
          status: activity.status,
          account_id: activity.account_id,
          contact_id: activity.contact_id,
          deal_id: activity.deal_id,
        })
        .eq("id", id)
        .eq("owner_id", user.id);

      if (error) {
        toast({
          title: "Fehler",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({ 
          title: "Erfolgreich", 
          description: "Aktivität aktualisiert" 
        });
        setIsEditing(false);
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive"
      });
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
