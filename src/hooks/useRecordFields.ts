
import { useEffect, useState } from "react";
import { useObjectFields } from "@/hooks/useObjectFields";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useQueryClient } from "@tanstack/react-query";

export function useRecordFields(objectTypeId: string) {
  const { fields: originalFields, isLoading, refetch } = useObjectFields(objectTypeId);
  const [sortedFields, setSortedFields] = useState<ObjectField[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (originalFields) {
      // Make sure we have fields to display
      console.log("Record fields received:", originalFields.length, "fields");
      const sorted = [...originalFields].sort((a, b) => a.display_order - b.display_order);
      setSortedFields(sorted);
    }
  }, [originalFields]);

  // Listen for field refresh events
  useEffect(() => {
    const handleRefetchFields = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.objectTypeId === objectTypeId) {
        console.log("Refreshing fields for object type:", objectTypeId);
        queryClient.invalidateQueries({ queryKey: ["object-fields", objectTypeId] });
        refetch(); // Add direct refetch call
      }
    };

    window.addEventListener('refetch-fields', handleRefetchFields as EventListener);
    
    return () => {
      window.removeEventListener('refetch-fields', handleRefetchFields as EventListener);
    };
  }, [objectTypeId, queryClient, refetch]);

  return {
    fields: sortedFields,
    isLoading,
    refetch
  };
}
