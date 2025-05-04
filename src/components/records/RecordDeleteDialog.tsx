
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteDialog } from "@/components/common/DeleteDialog";

interface RecordDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  objectTypeName?: string; // Added this prop to be compatible with ObjectRecordDetail
}

export function RecordDeleteDialog({ open, onOpenChange, onConfirm, objectTypeName }: RecordDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  // Add object type name to the description if provided
  const description = objectTypeName 
    ? `This action cannot be undone. This will permanently delete this ${objectTypeName.toLowerCase()} record and remove its data from our servers.`
    : "This action cannot be undone. This will permanently delete this record and remove its data from our servers.";

  return (
    <DeleteDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title="Are you sure?"
      description={description}
      onConfirm={handleConfirm}
      isDeleting={isDeleting}
      deleteButtonText="Delete"
    />
  );
}
