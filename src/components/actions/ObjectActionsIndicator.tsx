
import { useState, useEffect } from "react";
import { PlayCircle } from "lucide-react";
import { useActions } from "@/hooks/useActions";

interface ObjectActionsIndicatorProps {
  objectTypeId: string;
}

export function ObjectActionsIndicator({ objectTypeId }: ObjectActionsIndicatorProps) {
  const { getActionsByObjectId } = useActions();
  const [hasActions, setHasActions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkForActions = async () => {
      try {
        setIsLoading(true);
        const actions = await getActionsByObjectId(objectTypeId);
        setHasActions(actions && actions.length > 0);
      } catch (error) {
        console.error("Error checking for actions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkForActions();
  }, [objectTypeId, getActionsByObjectId]);

  // Don't render anything if loading or no actions
  if (isLoading || !hasActions) {
    return null;
  }

  return (
    <PlayCircle className="h-4 w-4 text-primary ml-1" aria-label="Has actions" />
  );
}
