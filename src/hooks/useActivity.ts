
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function useActivity(id: string | undefined) {
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user || !id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .eq("id", id)
          .eq("owner_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching activity:", error);
          toast({
            title: "Fehler",
            description: "Aktivität nicht gefunden",
            variant: "destructive"
          });
        } else {
          setActivity(data);
        }
      } catch (error) {
        console.error("Exception fetching activity:", error);
        toast({
          title: "Fehler",
          description: "Fehler beim Laden der Aktivität",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id, user, toast]);

  const handleFieldChange = (field: string, value: any) => {
    setActivity(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = () => {
    if (!activity) return;
    const newStatus = activity.status === "done" ? "open" : "done";
    handleFieldChange("status", newStatus);
  };

  const saveActivity = async () => {
    if (!user || !id || !activity) return;

    setSaving(true);
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
        console.error("Error saving activity:", error);
        toast({
          title: "Fehler",
          description: error.message,
          variant: "destructive"
        });
        return false;
      } else {
        toast({ 
          title: "Erfolgreich", 
          description: "Aktivität aktualisiert" 
        });
        return true;
      }
    } catch (error: any) {
      console.error("Exception saving activity:", error);
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    activity,
    loading,
    saving,
    handleFieldChange,
    handleStatusChange,
    saveActivity
  };
}
