
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface PublishingConfigDialogProps {
  objectTypeId: string;
  isPublished: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishingConfigDialog({
  objectTypeId,
  isPublished,
  onPublish,
  onUnpublish,
  open,
  onOpenChange,
}: PublishingConfigDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async () => {
    try {
      setIsProcessing(true);
      if (isPublished) {
        await onUnpublish();
      } else {
        await onPublish();
      }
    } finally {
      setIsProcessing(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isPublished ? "Unpublish Object" : "Publish Object"}
          </DialogTitle>
          <DialogDescription>
            {isPublished
              ? "This will make your object private again and remove it from the public directory."
              : "Publishing will make your object visible to other users. They'll be able to view and import your object structure."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleAction}
            disabled={isProcessing}
            variant={isPublished ? "destructive" : "default"}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isPublished ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
