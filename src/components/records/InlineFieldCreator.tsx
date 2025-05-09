
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AddFieldSheet } from "./AddFieldSheet";
import { toast } from "sonner";

interface InlineFieldCreatorProps {
  objectTypeId: string;
  suggestedFieldName?: string;
  onFieldCreated: () => void;
  variant?: "icon" | "button";
  className?: string;
}

export function InlineFieldCreator({
  objectTypeId,
  suggestedFieldName,
  onFieldCreated,
  variant = "button",
  className = "",
}: InlineFieldCreatorProps) {
  const [isAddFieldSheetOpen, setIsAddFieldSheetOpen] = useState(false);

  const handleOpenAddFieldSheet = () => {
    setIsAddFieldSheetOpen(true);
  };

  const handleFieldCreated = () => {
    toast.success("Field created successfully");
    onFieldCreated();
    setIsAddFieldSheetOpen(false);
  };

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="sm"
          className={`p-1 h-auto ${className}`}
          onClick={handleOpenAddFieldSheet}
        >
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Create new field</span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={`${className}`}
          onClick={handleOpenAddFieldSheet}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Field
        </Button>
      )}

      <AddFieldSheet
        open={isAddFieldSheetOpen}
        onOpenChange={setIsAddFieldSheetOpen}
        objectTypeId={objectTypeId}
        onFieldCreated={handleFieldCreated}
        initialName={suggestedFieldName}
      />
    </>
  );
}
