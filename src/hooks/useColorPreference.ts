
import { useAuth } from '@/contexts/AuthContext';

export function useColorPreference() {
  const { favoriteColor, setFavoriteColor } = useAuth();

  const updateColorPreference = async (color: string) => {
    await setFavoriteColor(color);
  };

  return {
    favoriteColor,
    updateColorPreference
  };
}
