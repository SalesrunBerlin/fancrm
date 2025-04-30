
import { DeleteDialog } from "@/components/common/DeleteDialog";

interface RecordDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  recordName?: string;
}

export function RecordDeleteDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  recordName = "this record" 
}: RecordDeleteDialogProps) {
  return (
    <DeleteDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Are you sure?"
      description={`This action cannot be undone. This will permanently delete ${recordName} and remove its data from our servers.`}
      deleteButtonText="Delete"
      isDestructive={true}
    />
  );
}
