
import { useUserViewSettings } from "./useUserViewSettings";

interface LayoutViewSettings {
  viewMode: "table" | "kanban";
}

const DEFAULT_SETTINGS: LayoutViewSettings = {
  viewMode: "table"
};

export function useLayoutViewSettings(objectTypeId: string | undefined) {
  const { settings, updateSettings, isLoading } = useUserViewSettings(objectTypeId, 'layout');
  
  // Ensure settings are properly typed and have default values
  const layoutSettings = settings as Partial<LayoutViewSettings>;
  
  // Initialize with default values if properties are missing
  const effectiveSettings: LayoutViewSettings = {
    viewMode: layoutSettings?.viewMode || DEFAULT_SETTINGS.viewMode
  };

  const updateViewMode = (viewMode: "table" | "kanban") => {
    console.log("Updating view mode to:", viewMode);
    updateSettings({
      ...effectiveSettings,
      viewMode
    });
  };

  return {
    viewMode: effectiveSettings.viewMode,
    updateViewMode,
    isLoading
  };
}
