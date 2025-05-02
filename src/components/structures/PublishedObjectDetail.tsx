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
  const [isImporting, setIsImporting] = useState(false);
  const { importObjectType } = useObjectTypes();

  const handleImport = async () => {
    try {
      setIsImporting(true);
      await importObjectType.mutateAsync(objectType.id);
      toast.success("Object structure imported successfully", {
        description: "You can now find it in your Object Manager",
      });
      onClose?.(); // Close the dialog on successful import
    } catch (error) {
      console.error("Error importing object:", error);
      toast.error("Failed to import object", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog>
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
        <Button disabled={isImporting} onClick={handleImport}>
          {isImporting ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Import
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
