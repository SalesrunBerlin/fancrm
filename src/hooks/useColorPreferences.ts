
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ColorPreferences {
  primary: string;
  text: string;
  font: string;
}

export interface ColorPreferencesData {
  theme: 'light' | 'dark';
  colors: ColorPreferences;
}

export function useColorPreferences() {
  const [preferences, setPreferences] = useState<ColorPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
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
        setPreferences(data);
        applyThemePreferences(data);
      } else {
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
        // Save default preferences for new user
        await savePreferencesToDB(defaultPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error("Failed to load theme preferences");
    } finally {
      setLoading(false);
    }
  };

  const applyThemePreferences = (prefs: ColorPreferencesData) => {
    try {
      // Set CSS variables
      document.documentElement.style.setProperty('--primary-color', prefs.colors.primary);
      document.documentElement.style.setProperty('--text-color', prefs.colors.text);
      document.documentElement.style.setProperty('--font-family', `${prefs.colors.font}, sans-serif`);
      
      // Update theme class
      document.documentElement.classList.forEach(className => {
        if (className.startsWith('theme-')) {
          document.documentElement.classList.remove(className);
        }
      });
      
      document.documentElement.classList.add(`theme-${prefs.colors.font}`);
      
      // Create or update the style element
      const style = document.getElementById('theme-custom-styles') || document.createElement('style');
      style.id = 'theme-custom-styles';
      style.textContent = `
        :root {
          --primary: ${prefs.colors.primary};
        }
        
        .button-primary, 
        [data-variant="default"],
        .bg-primary {
          background-color: ${prefs.colors.primary} !important;
          color: white !important;
        }
        
        .button-primary:hover,
        [data-variant="default"]:hover,
        .bg-primary:hover {
          opacity: 0.9;
        }
        
        body {
          color: ${prefs.colors.text};
          font-family: ${prefs.colors.font}, sans-serif;
        }
      `;
      
      if (!style.parentNode) {
        document.head.appendChild(style);
      }
    } catch (error) {
      console.error('Error applying theme preferences:', error);
    }
  };

  // Function to save preferences to database
  const savePreferencesToDB = async (newPreferences: ColorPreferencesData): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log('Saving preferences to DB:', newPreferences);
      
      // Save to database
      const { error } = await supabase
        .from('user_color_preferences')
        .upsert({
          user_id: user.id,
          theme: newPreferences.theme,
          colors: newPreferences.colors
        }, { 
          onConflict: 'user_id' 
        });

      if (error) {
        console.error('Database error when saving preferences:', error);
        throw error;
      }
      
      console.log('Successfully saved preferences to DB');
      return true;
    } catch (error) {
      console.error('Error saving preferences to database:', error);
      throw error; // Re-throw to be handled by caller
    }
  };

  const savePreferences = async (newPreferences: ColorPreferencesData): Promise<boolean> => {
    try {
      if (!newPreferences) {
        console.error('Attempted to save null preferences');
        return false;
      }
      
      console.log('Saving preferences:', newPreferences);
      
      // First apply the theme immediately for instant feedback
      applyThemePreferences(newPreferences);
      
      // Then save to database
      const success = await savePreferencesToDB(newPreferences);
      
      if (success) {
        // Update state after successful save
        setPreferences(newPreferences);
        toast.success("Theme preferences saved successfully");
      }
      
      return success;
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error("Failed to save theme preferences");
      return false;
    }
  };

  return {
    preferences,
    loading,
    savePreferences
  };
}
