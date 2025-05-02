
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { Action, useActions } from "@/hooks/useActions";
import { toast } from "sonner";

interface ObjectActionsSectionProps {
  objectTypeId: string;
  objectTypeName?: string;
}

export function ObjectActionsSection({ objectTypeId, objectTypeName }: ObjectActionsSectionProps) {
  const navigate = useNavigate();
  const { getActionsByObjectId } = useActions();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    console.log(`ObjectActionsSection: Effect running for objectTypeId: ${objectTypeId}`);
    console.log(`ObjectActionsSection: Current initialized state: ${initialized}`);
    
    // Prevent fetch if no objectTypeId is provided
    if (!objectTypeId) {
      console.log("ObjectActionsSection: No objectTypeId provided, skipping fetch");
      setLoading(false);
      return;
    }
    
    // Prevent multiple fetches for the same objectTypeId
    if (initialized) {
      console.log("ObjectActionsSection: Already initialized, skipping fetch");
      return;
    }
    
    const fetchActions = async () => {
      console.log(`ObjectActionsSection: Starting fetch for objectTypeId: ${objectTypeId}`);
      setLoading(true);
      setError(null);
      
      try {
        console.log(`ObjectActionsSection: Calling getActionsByObjectId for ${objectTypeId}`);
        const objectActions = await getActionsByObjectId(objectTypeId);
        
        // Log the actual response for debugging
        console.log(`ObjectActionsSection: Raw response:`, objectActions);
        
        if (!objectActions || objectActions.length === 0) {
          console.log(`ObjectActionsSection: No actions found for objectTypeId: ${objectTypeId}`);
          setActions([]);
        } else {
          console.log(`ObjectActionsSection: Found ${objectActions.length} actions for objectTypeId: ${objectTypeId}`);
          setActions(objectActions);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to fetch actions");
        console.error("Error fetching actions in ObjectActionsSection:", error);
        setError(error);
        toast.error("Failed to load actions", {
          description: error.message
        });
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    fetchActions();
  }, [objectTypeId, getActionsByObjectId]);

  const handleExecuteAction = (actionId: string) => {
    navigate(`/actions/execute/${actionId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4 mb-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything if there are no actions and we're not loading
  if (!actions || actions.length === 0) {
    console.log(`ObjectActionsSection: No actions to display for objectTypeId: ${objectTypeId}`);
    return null;
  }

  if (error) {
    return null; // Don't show error UI, just don't display actions
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {actions.map((action) => (
        <Button 
          key={action.id}
          onClick={() => handleExecuteAction(action.id)}
          className="h-8"
        >
          <PlayCircle className="mr-1.5 h-4 w-4" />
          {action.name}
        </Button>
      ))}
    </div>
  );
}

function formatActionType(type: string): string {
  switch (type) {
    case 'new_record':
      return 'Create Record';
    default:
      return type.replace(/_/g, ' ');
  }
}
