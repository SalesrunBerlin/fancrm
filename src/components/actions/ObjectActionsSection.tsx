
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { Action, useActions } from "@/hooks/useActions";
import { toast } from "sonner";

interface ObjectActionsSectionProps {
  objectTypeId: string;
  objectTypeName?: string;
  recordId?: string; // Add recordId for context in linked actions
}

export function ObjectActionsSection({ 
  objectTypeId, 
  objectTypeName,
  recordId
}: ObjectActionsSectionProps) {
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

  const handleExecuteAction = (action: Action) => {
    // Update the navigation paths to use the new route format
    if (action.action_type === "linked_record" && recordId) {
      // For linked records, navigate to the new route format with "from" parameter
      console.log(`ObjectActionsSection: Executing linked action ${action.id} with record ${recordId}`);
      navigate(`/actions/execute/${action.id}/from/${recordId}`);
    } else {
      // For global actions, just pass the actionId
      console.log(`ObjectActionsSection: Executing global action ${action.id}`);
      navigate(`/actions/execute/${action.id}`);
    }
  };

  // Filter actions based on context
  const filteredActions = actions.filter(action => {
    // On record detail page (with recordId), show only linked actions
    if (recordId) {
      return action.action_type === "linked_record";
    }
    // On object list page (no recordId), show only global actions
    return action.action_type === "new_record";
  });

  if (loading) {
    return (
      <div className="flex justify-center py-4 mb-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything if there are no actions and we're not loading
  if (!filteredActions || filteredActions.length === 0) {
    console.log(`ObjectActionsSection: No actions to display for objectTypeId: ${objectTypeId}`);
    return null;
  }

  if (error) {
    return null; // Don't show error UI, just don't display actions
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filteredActions.map((action) => (
        <Button 
          key={action.id}
          onClick={() => handleExecuteAction(action)}
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
    case 'linked_record':
      return 'Create Linked Record';
    default:
      return type.replace(/_/g, ' ');
  }
}
