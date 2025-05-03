
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ObjectType } from "@/hooks/useObjectTypes";
import { Eye, Download } from "lucide-react";
import { useState } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { toast } from "sonner";

interface PublishedObjectDetailProps {
  objectType: ObjectType;
  children?: React.ReactNode;
  onClose?: () => void;
}

export function PublishedObjectDetail({ objectType, children, onClose }: PublishedObjectDetailProps) {
  const [isImplementing, setIsImplementing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { importObjectType } = useObjectTypes();

  const handleImplement = async () => {
    try {
      setIsImplementing(true);
      await importObjectType.mutateAsync(objectType.id);
      toast.success("Object structure implemented successfully", {
        description: "You can now find it in your Object Manager",
      });
      setDialogOpen(false);
      onClose?.(); // Close the dialog on successful implementation
    } catch (error) {
      console.error("Error implementing object:", error);
      toast.error("Failed to implement object", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsImplementing(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {objectType.name}
          </DialogTitle>
          <DialogDescription>
            {objectType.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Eye className="col-span-1 h-4 w-4" />
            <p className="col-span-3 text-sm">
              {objectType.api_name}
            </p>
          </div>
        </div>
        <Button disabled={isImplementing} onClick={handleImplement}>
          {isImplementing ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-spin" />
              Implementing...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Implement
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
