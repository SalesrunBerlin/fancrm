
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export const useColorPreference = () => {
  const { favoriteColor, setFavoriteColor } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  
  // Log when color preference changes for debugging
  console.log("useColorPreference hook - current color:", favoriteColor);
  
  const saveUserColorPreference = async (color: string): Promise<boolean> => {
    try {
      setLoading(true);
      if (setFavoriteColor) {
        return await setFavoriteColor(color);
      }
      return false;
    } catch (error) {
      console.error("Error saving color preference:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const updateColorPreference = async (color: string): Promise<boolean> => {
    return await saveUserColorPreference(color);
  };
  
  return {
    favoriteColor: favoriteColor || 'default',
    theme,
    saveUserColorPreference,
    updateColorPreference,
    loading
  };
};
