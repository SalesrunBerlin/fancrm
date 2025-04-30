
import { useEffect, useState } from "react";
import { useObjectFields } from "@/hooks/useObjectFields";
import { ObjectField } from "@/hooks/useObjectTypes";

export function useRecordFields(objectTypeId: string) {
  const { fields: originalFields, isLoading } = useObjectFields(objectTypeId);
  const [sortedFields, setSortedFields] = useState<ObjectField[]>([]);

  useEffect(() => {
    if (originalFields) {
      // Make sure we have fields to display
      console.log("Record fields received:", originalFields.length, "fields");
      const sorted = [...originalFields].sort((a, b) => a.display_order - b.display_order);
      setSortedFields(sorted);
    }
  }, [originalFields]);

  return {
    fields: sortedFields,
    isLoading
  };
}
