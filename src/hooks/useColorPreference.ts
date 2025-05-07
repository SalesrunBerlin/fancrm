
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useColorPreference() {
  const { user, favoriteColor: contextFavoriteColor, setFavoriteColor: updateContextFavoriteColor } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user's color preference
  useEffect(() => {
    const fetchColorPreference = async () => {
      if (!user) {
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
        
        // Check if data exists and has favorite_color property
        if (data && 'favorite_color' in data) {
          updateContextFavoriteColor(data.favorite_color || "default");
        }
      } catch (error: any) {
        console.error("Error fetching color preference:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchColorPreference();
  }, [user, updateContextFavoriteColor]);

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
      
      updateContextFavoriteColor(color);
      toast.success("Color preference updated successfully");
      return true;
    } catch (error: any) {
      console.error("Error updating color preference:", error);
      toast.error("Failed to update color preference");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    favoriteColor: contextFavoriteColor,
    updateColorPreference,
    loading
  };
}
