
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Action, useActions } from "@/hooks/useActions";
import { toast } from "sonner";
import { ExpandableActionButton } from "./ExpandableActionButton";
import { Skeleton } from "@/components/ui/skeleton";

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
  const queryClient = useQueryClient();
  const { getActionsByObjectId } = useActions();
  
  // Use React Query for optimized data fetching with proper caching
  const { data: actions, isLoading } = useQuery({
    queryKey: ["object-actions", objectTypeId, recordId ? "record" : "list"],
    queryFn: async () => {
      if (!objectTypeId) return [];
      return await getActionsByObjectId(objectTypeId);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
    enabled: !!objectTypeId,
  });
  
  // Check if we're on a target object page with React Query
  const { data: isTargetOfLinkedActions } = useQuery({
    queryKey: ["is-target-of-linked-actions", objectTypeId],
    queryFn: async () => {
      if (!objectTypeId) return false;
      
      try {
        // Use a simpler, more efficient query
        const { count, error } = await supabase
          .from("actions")
          .select("id", { count: 'exact', head: true })
          .eq("action_type", "linked_record")
          .eq("target_object_id", objectTypeId);
          
        if (error) throw error;
        return count && count > 0;
      } catch (err) {
        console.error("Error checking if object is target of linked actions:", err);
        return false;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24,  // 24 hours
    enabled: !!objectTypeId,
  });

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
  const filteredActions = actions?.filter(action => {
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
  }) || [];

  if (isLoading) {
    // Return skeleton loading state for better UX
    return inTable ? (
      <Skeleton className="h-8 w-20" />
    ) : (
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  // Don't render anything if there are no actions and we're not loading
  if (!filteredActions || filteredActions.length === 0) {
    return null;
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
