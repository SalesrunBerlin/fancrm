
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ColorPreferences {
  primary: string;
  text: string;
  font: string;
}

interface ColorPreferencesData {
  theme: 'light' | 'dark';
  colors: ColorPreferences;
}

export function useColorPreferences() {
  const [preferences, setPreferences] = useState<ColorPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_color_preferences')
        .select('*')
        .single();

      if (error) throw error;
      
      if (data) {
        setPreferences(data);
      } else {
        // Set default preferences
        const defaultPreferences = {
          theme: 'light',
          colors: {
            primary: '#6B8AFE',
            text: '#000000',
            font: 'inter'
          }
        };
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: ColorPreferencesData) => {
    try {
      const { error } = await supabase
        .from('user_color_preferences')
        .upsert({
          user_id: user?.id,
          theme: newPreferences.theme,
          colors: newPreferences.colors
        });

      if (error) throw error;

      setPreferences(newPreferences);
      toast({
        title: "Success",
        description: "Theme preferences saved successfully",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save theme preferences",
        variant: "destructive",
      });
    }
  };

  return {
    preferences,
    loading,
    savePreferences
  };
}
