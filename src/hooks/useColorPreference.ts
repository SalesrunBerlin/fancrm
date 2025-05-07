
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export const useColorPreference = () => {
  const { favoriteColor, setFavoriteColor } = useAuth();
  const { theme } = useTheme();
  
  const saveUserColorPreference = async (color: string) => {
    if (setFavoriteColor) {
      await setFavoriteColor(color);
      return true;
    }
    return false;
  };
  
  return {
    favoriteColor: favoriteColor || 'default',
    theme,
    saveUserColorPreference,
  };
};
