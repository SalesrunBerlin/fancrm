import {
  Archive,
  ArrowLeft,
  Box,
  ExternalLink,
  MoreVertical,
  Trash,
  AppWindow,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { toast } from "sonner";
import { useState } from "react";
import { ApplicationAssignmentDialog } from "@/components/settings/ApplicationAssignmentDialog";

interface ObjectTypeDetailHeaderProps {
  objectTypeId: string;
  objectName: string;
}

export function ObjectTypeDetailHeader({ objectTypeId, objectName }: ObjectTypeDetailHeaderProps) {
  const navigate = useNavigate();
  const { archiveObjectType, unpublishObjectType, deleteObjectType } = useObjectTypes();
  const [showAppAssignmentDialog, setShowAppAssignmentDialog] = useState(false);

  const handleArchive = async () => {
    try {
      await archiveObjectType.mutateAsync(objectTypeId);
      navigate("/settings/object-manager");
    } catch (error) {
      console.error("Error archiving object type:", error);
      toast.error("Failed to archive object type");
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublishObjectType.mutateAsync(objectTypeId);
      toast.success("Object type unpublished successfully");
    } catch (error) {
      console.error("Error unpublishing object type:", error);
      toast.error("Failed to unpublish object type");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteObjectType.mutateAsync(objectTypeId);
      navigate("/settings/object-manager");
    } catch (error) {
      console.error("Error deleting object type:", error);
      toast.error("Failed to delete object type");
    }
  };

  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="mb-4 flex items-center justify-between md:mb-0">
        <div className="flex items-center">
          <Link to="/settings/object-manager">
            <Button variant="ghost" size="sm" className="mr-2 px-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">{objectName}</h1>
        </div>
        <div className="flex items-center">
          <Button size="sm" onClick={() => setShowAppAssignmentDialog(true)}>
            <AppWindow className="mr-2 h-4 w-4" />
            Applications
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUnpublish}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Unpublish
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ApplicationAssignmentDialog
        objectTypeId={objectTypeId}
        objectName={objectName}
        open={showAppAssignmentDialog}
        onOpenChange={setShowAppAssignmentDialog}
      />
    </div>
  );
}
