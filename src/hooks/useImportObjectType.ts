
import { useState } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { toast } from "sonner";

export function useImportObjectType(onClose: () => void) {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isImplementing, setIsImplementing] = useState(false);
  const { importObjectType } = useObjectTypes();

  const handleObjectIdChange = (objectId: string | null) => {
    setSelectedObjectId(objectId);
  };

  const handleImplement = async () => {
    try {
      setIsImplementing(true);
      await importObjectType.mutateAsync(selectedObjectId as string);
      toast.success("Object structure implemented successfully", {
        description: "The object has been added to your Object Manager"
      });
      onClose();
    } catch (error: any) {
      console.error("Implementation error:", error);
      toast.error("Failed to implement object", {
        description: error?.message || "Unknown error occurred"
      });
    } finally {
      setIsImplementing(false);
    }
  };

  return {
    selectedObjectId,
    isImplementing,
    handleObjectIdChange,
    handleImplement,
  };
}
