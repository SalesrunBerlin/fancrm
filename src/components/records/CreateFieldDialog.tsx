
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ObjectFieldForm } from "@/components/settings/ObjectFieldForm";
import { ObjectField } from "@/hooks/useObjectTypes";
import { Loader2 } from "lucide-react";

interface CreateFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectTypeId: string;
  columnName: string;
  onFieldCreated: (field: ObjectField) => void;
}

export function CreateFieldDialog({
  open,
  onOpenChange,
  objectTypeId,
  columnName,
  onFieldCreated,
}: CreateFieldDialogProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleFieldCreated = (field: ObjectField) => {
    onFieldCreated(field);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Field</DialogTitle>
          <DialogDescription>
            Create a new field for column &quot;{columnName}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ObjectFieldForm 
            objectTypeId={objectTypeId} 
            initialName={columnName}
            onComplete={handleFieldCreated}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
