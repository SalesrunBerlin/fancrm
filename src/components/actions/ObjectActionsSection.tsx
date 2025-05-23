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
  selectedRecordIds?: string[]; // Add selectedRecordIds for mass actions
  inTable?: boolean; // Add flag to indicate if shown in a table cell
}

export function ObjectActionsSection({ 
  objectTypeId, 
  objectTypeName,
  recordId,
  selectedRecordIds = [],
  inTable = false
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
    // Handle different action types with appropriate navigation
    switch (action.action_type) {
      case "linked_record":
        if (recordId) {
          // For linked records, navigate to the new route format with "from" parameter
          console.log(`ObjectActionsSection: Executing linked action ${action.id} with record ${recordId}`);
          navigate(`/actions/execute/${action.id}/from/${recordId}`);
        }
        break;
        
      case "mass_action":
        // For mass actions, navigate to the mass action page with selected records
        console.log(`ObjectActionsSection: Executing mass action ${action.id} with ${selectedRecordIds.length} selected records`);
        
        if (selectedRecordIds.length > 0) {
          // Pass the selected record IDs as a URL parameter
          const recordIdsParam = selectedRecordIds.join(',');
          navigate(`/actions/mass/${action.id}?records=${recordIdsParam}`);
        } else {
          // If no records are selected, navigate to the regular mass action page
          navigate(`/actions/mass/${action.id}`);
        }
        break;
        
      case "new_record":
      default:
        // For global actions, just pass the actionId
        console.log(`ObjectActionsSection: Executing global action ${action.id}`);
        navigate(`/actions/execute/${action.id}`);
        break;
    }
  };

  // Filter actions based on context
  const filteredActions = actions.filter(action => {
    // When in a table row, only show linked record actions
    if (inTable && recordId) {
      return action.action_type === "linked_record";
    }
    
    // On record detail page (with recordId), show only linked actions
    if (recordId) {
      // If we're on a target object page and this is a linked_record action, don't show it
      if (isTargetOfLinkedActions && action.action_type === "linked_record") {
        return false;
      }
      return action.action_type === "linked_record";
    }
    
    // On object list page with selected records, show only mass actions
    if (selectedRecordIds.length > 0) {
      return action.action_type === "mass_action";
    }
    
    // On object list page (no recordId and no selected records), show global actions
    return action.action_type === "new_record";
  });

  if (loading && !inTable) {
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

  if (error && !inTable) {
    return null; // Don't show error UI, just don't display actions
  }

  // Use a dropdown layout for table view
  if (inTable) {
    // Format actions for the dropdown
    const dropdownActions = filteredActions.map(action => ({
      name: action.name,
      color: action.color,
      onClick: () => handleExecuteAction(action)
    }));

    return (
      <ExpandableActionButton
        actionName="Actions"
        color="default"
        onExecute={() => {}}
        dropdown={true}
        actions={dropdownActions}
      />
    );
  }

  // Default layout with flex-wrap for side-by-side display
  return (
    <div className="flex flex-wrap gap-3">
      {filteredActions.map((action) => (
        <div key={action.id} className="mb-3">
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
    case 'mass_action':
      return 'Mass Update Records';
    default:
      return type.replace(/_/g, ' ');
  }
}
