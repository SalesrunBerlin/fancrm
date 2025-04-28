
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
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPreferences(data);
        applyThemePreferences(data);
      } else {
        // Set default preferences
        const defaultPreferences = {
          theme: 'light' as const,
          colors: {
            primary: '#6B8AFE',
            text: '#000000',
            font: 'inter'
          }
        };
        setPreferences(defaultPreferences);
        applyThemePreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load theme preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyThemePreferences = (prefs: ColorPreferencesData) => {
    document.documentElement.style.setProperty('--primary-color', prefs.colors.primary);
    document.documentElement.style.setProperty('--text-color', prefs.colors.text);
    document.documentElement.style.fontFamily = prefs.colors.font;
  };

  const savePreferences = async (newPreferences: ColorPreferencesData) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_color_preferences')
        .upsert({
          user_id: user.id,
          theme: newPreferences.theme,
          colors: newPreferences.colors
        });

      if (error) throw error;

      setPreferences(newPreferences);
      applyThemePreferences(newPreferences);
      
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
