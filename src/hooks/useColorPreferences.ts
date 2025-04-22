
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";

interface ColorSetting {
  id: string;
  label: string;
  value: string;
  cssVariable: string;
}

export const defaultLightColors: ColorSetting[] = [
  { id: "background", label: "Hintergrund", value: "#FFFFFF", cssVariable: "--background" },
  { id: "foreground", label: "Text", value: "#000000", cssVariable: "--foreground" },
  { id: "primary", label: "Button", value: "#6B8AFE", cssVariable: "--primary" },
];

export const defaultDarkColors: ColorSetting[] = [
  { id: "background", label: "Hintergrund", value: "#0F172A", cssVariable: "--background" },
  { id: "foreground", label: "Text", value: "#FFFFFF", cssVariable: "--foreground" },
  { id: "primary", label: "Button", value: "#6B8AFE", cssVariable: "--primary" },
];

export const useColorPreferences = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [colors, setColors] = useState<ColorSetting[]>(
    theme === 'dark' ? defaultDarkColors : defaultLightColors
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_color_preferences')
          .select('colors')
          .eq('user_id', user.id)
          .eq('theme', theme)
          .single();

        if (error) throw error;
        
        if (data?.colors) {
          // Type assertion to handle the JSON conversion
          const savedColors = data.colors as ColorSetting[];
          setColors(savedColors);
          // Apply saved colors
          savedColors.forEach(color => {
            document.documentElement.style.setProperty(color.cssVariable, color.value);
          });
        } else {
          // If no saved preferences, apply default colors for current theme
          const defaultColors = theme === 'dark' ? defaultDarkColors : defaultLightColors;
          defaultColors.forEach(color => {
            document.documentElement.style.setProperty(color.cssVariable, color.value);
          });
          setColors(defaultColors);
        }
      } catch (error) {
        console.error('Error loading color preferences:', error);
      }
    };

    loadPreferences();
  }, [user, theme]);

  const savePreferences = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_color_preferences')
        .upsert({
          user_id: user.id,
          theme,
          colors: colors as unknown as Json // Type assertion to handle the JSON conversion
        }, {
          onConflict: 'user_id,theme'
        });

      if (error) throw error;
      
      // Apply colors immediately after saving
      colors.forEach(color => {
        document.documentElement.style.setProperty(color.cssVariable, color.value);
      });
      
      toast.success('Farbeinstellungen gespeichert');
    } catch (error) {
      console.error('Error saving color preferences:', error);
      toast.error('Fehler beim Speichern der Farbeinstellungen');
    } finally {
      setIsSaving(false);
    }
  };

  const resetColors = () => {
    const defaultColors = theme === 'dark' ? defaultDarkColors : defaultLightColors;
    defaultColors.forEach(color => {
      document.documentElement.style.setProperty(color.cssVariable, color.value);
    });
    setColors(defaultColors);
  };

  const updateColor = (id: string, newValue: string) => {
    setColors(prevColors =>
      prevColors.map(color => {
        if (color.id === id) {
          document.documentElement.style.setProperty(color.cssVariable, newValue);
          return { ...color, value: newValue };
        }
        return color;
      })
    );
  };

  return {
    colors,
    updateColor,
    resetColors,
    savePreferences,
    isSaving
  };
};
