
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useColorPreference() {
  const { user } = useAuth();
  const [favoriteColor, setFavoriteColor] = useState<string>("default");
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user's color preference
  useEffect(() => {
    const fetchColorPreference = async () => {
      if (!user) {
        setFavoriteColor("default");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("favorite_color")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        
        setFavoriteColor(data?.favorite_color || "default");
      } catch (error: any) {
        console.error("Error fetching color preference:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchColorPreference();
  }, [user]);

  // Update user's color preference
  const updateColorPreference = async (color: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .update({ favorite_color: color })
        .eq("id", user.id);

      if (error) throw error;
      
      setFavoriteColor(color);
      toast.success("Farbpräferenz wurde aktualisiert");
      return true;
    } catch (error: any) {
      console.error("Error updating color preference:", error);
      toast.error("Fehler beim Aktualisieren der Farbpräferenz");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    favoriteColor,
    updateColorPreference,
    loading
  };
}
