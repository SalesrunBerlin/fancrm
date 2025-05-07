
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export const useColorPreference = () => {
  const { favoriteColor, setFavoriteColor } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  
  const saveUserColorPreference = async (color: string) => {
    try {
      setLoading(true);
      if (setFavoriteColor) {
        await setFavoriteColor(color);
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const updateColorPreference = async (color: string) => {
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
