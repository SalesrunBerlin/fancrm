import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Action, useActions } from "@/hooks/useActions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ExpandableActionButton } from "./ExpandableActionButton";

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
  const location = useLocation();
  const { getActionsByObjectId } = useActions();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isTargetOfLinkedActions, setIsTargetOfLinkedActions] = useState(false);
  
  // Check if we're on a target object page by examining if this object is the target of linked actions
  useEffect(() => {
    if (!objectTypeId) return;
    
    const checkIfTargetObject = async () => {
      try {
        // Get all actions where this object is the target
        const { data, error } = await supabase
          .from("actions")
          .select("id")
          .eq("action_type", "linked_record")
          .eq("target_object_id", objectTypeId);
          
        if (error) throw error;
        
        // If any linked_record actions target this object type, set the flag
        setIsTargetOfLinkedActions(data && data.length > 0);
        console.log(`Object ${objectTypeId} is target of linked actions: ${data && data.length > 0}`);
      } catch (err) {
        console.error("Error checking if object is target of linked actions:", err);
      }
    };
    
    checkIfTargetObject();
  }, [objectTypeId]);
  
  useEffect(() => {
    console.log(`ObjectActionsSection: Effect running for objectTypeId: ${objectTypeId}`);
    
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
      // If we're on a target object page and this is a linked_record action, don't show it
      if (isTargetOfLinkedActions && action.action_type === "linked_record") {
        return false;
      }
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
    <div className="flex flex-wrap gap-3 mb-6">
      {filteredActions.map((action) => (
        <div key={action.id} className="relative">
          <ExpandableActionButton
            actionName={action.name}
            color={action.color}
            onExecute={() => handleExecuteAction(action)}
          />
        </div>
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
