
import { useEffect, useState } from "react";
import { useObjectFields } from "@/hooks/useObjectFields";
import { ObjectField } from "@/hooks/useObjectTypes";

export function useRecordFields(objectTypeId: string) {
  const { fields, isLoading } = useObjectFields(objectTypeId);
  const [sortedFields, setSortedFields] = useState<ObjectField[]>([]);

  useEffect(() => {
    if (fields) {
      const sorted = [...fields].sort((a, b) => a.display_order - b.display_order);
      setSortedFields(sorted);
    }
  }, [fields]);

  return {
    fields: sortedFields,
    isLoading
  };
}
