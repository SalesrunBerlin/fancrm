
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
    } else {
      // Set default preferences when no user is logged in
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
      setLoading(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_color_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        console.log("Loaded preferences:", data);
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
        console.log("Setting default preferences");
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
      
      // Still set default preferences on error
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
    } finally {
      setLoading(false);
    }
  };

  const applyThemePreferences = (prefs: ColorPreferencesData) => {
    try {
      console.log("Applying theme preferences:", prefs);
      
      // Set CSS variables
      document.documentElement.style.setProperty('--primary-color', prefs.colors.primary);
      document.documentElement.style.setProperty('--text-color', prefs.colors.text);
      
      // Set font family
      document.documentElement.style.fontFamily = prefs.colors.font + ', sans-serif';
      
      // Apply classes to dynamically update button colors
      document.documentElement.classList.forEach(className => {
        if (className.startsWith('theme-')) {
          document.documentElement.classList.remove(className);
        }
      });
      
      document.documentElement.classList.add(`theme-${prefs.colors.font}`);
      
      // Add custom style for button colors
      const existingStyle = document.getElementById('theme-custom-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = 'theme-custom-styles';
      style.textContent = `
        :root {
          --primary: ${prefs.colors.primary};
        }
        
        .bg-primary {
          background-color: ${prefs.colors.primary} !important;
        }
        .text-primary {
          color: ${prefs.colors.primary} !important;
        }
        .border-primary {
          border-color: ${prefs.colors.primary} !important;
        }
        button.bg-primary:hover {
          background-color: ${adjustBrightness(prefs.colors.primary, -15)} !important;
        }
        body {
          color: ${prefs.colors.text};
          font-family: ${prefs.colors.font}, sans-serif;
        }
        
        /* Fix button color in shadcn components */
        .button-primary, [data-variant="default"], button[data-variant="default"] {
          background-color: ${prefs.colors.primary};
          color: white;
        }
        .button-primary:hover, [data-variant="default"]:hover, button[data-variant="default"]:hover {
          background-color: ${adjustBrightness(prefs.colors.primary, -15)};
        }
      `;
      document.head.appendChild(style);
    } catch (error) {
      console.error('Error applying theme preferences:', error);
    }
  };

  // Helper function to adjust color brightness
  const adjustBrightness = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (
      0x1000000 + 
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 + 
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 + 
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    ).toString(16).slice(1);
  };

  const savePreferences = async (newPreferences: ColorPreferencesData) => {
    if (!user) return false;
    
    try {
      console.log("Saving preferences:", newPreferences, "for user:", user.id);
      
      // Use upsert for better reliability
      const { error } = await supabase
        .from('user_color_preferences')
        .upsert({
          user_id: user.id,
          theme: newPreferences.theme,
          colors: newPreferences.colors
        });

      if (error) {
        console.error("Error saving preferences:", error);
        throw error;
      }

      setPreferences(newPreferences);
      applyThemePreferences(newPreferences);
      
      toast({
        title: "Success",
        description: "Theme preferences saved successfully",
      });
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save theme preferences",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    preferences,
    loading,
    savePreferences
  };
}
