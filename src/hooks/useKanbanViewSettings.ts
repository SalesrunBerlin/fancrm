
import { useLocalStorage } from "./useLocalStorage";

interface KanbanViewSettings {
  fieldApiName: string;
}

export function useKanbanViewSettings(objectTypeId: string | undefined) {
  const storageKey = objectTypeId ? `kanban-settings-${objectTypeId}` : '';
  const [settings, setSettings] = useLocalStorage<KanbanViewSettings>(
    storageKey,
    { fieldApiName: '' }
  );

  const updateFieldApiName = (fieldApiName: string) => {
    setSettings(prev => ({ ...prev, fieldApiName }));
  };

  return {
    settings,
    updateFieldApiName
  };
}
