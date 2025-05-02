
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteDialog } from "@/components/common/DeleteDialog";

interface RecordDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function RecordDeleteDialog({ open, onOpenChange, onConfirm }: RecordDeleteDialogProps) {
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

  return (
    <DeleteDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title="Are you sure?"
      description="This action cannot be undone. This will permanently delete this record and remove its data from our servers."
      onConfirm={handleConfirm}
      isDeleting={isDeleting}
      deleteButtonText="Delete"
    >
      {isDeleting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" />
      )}
    </DeleteDialog>
  );
}
