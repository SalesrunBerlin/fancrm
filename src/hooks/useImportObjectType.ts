
import { useState } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { toast } from "sonner";

export function useImportObjectType(onClose: () => void) {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { importObjectType } = useObjectTypes();

  const handleObjectIdChange = (objectId: string | null) => {
    setSelectedObjectId(objectId);
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      await importObjectType.mutateAsync(selectedObjectId as string);
      toast.success("Object structure imported successfully", {
        description: "The object has been added to your Object Manager"
      });
      onClose();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Failed to import object", {
        description: error?.message || "Unknown error occurred"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return {
    selectedObjectId,
    isImporting,
    handleObjectIdChange,
    handleImport,
  };
}
