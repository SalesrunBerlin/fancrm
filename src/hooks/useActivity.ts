
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function useActivity(id: string | undefined) {
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user || !id) return;

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

      if (error) {
        toast({
          title: "Fehler",
          description: "Aktivität nicht gefunden",
          variant: "destructive"
        });
      } else {
        setActivity(data);
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

  return {
    activity,
    loading,
    handleFieldChange,
    handleStatusChange
  };
}
