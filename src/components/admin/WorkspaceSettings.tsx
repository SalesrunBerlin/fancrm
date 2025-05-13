import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface WorkspaceSettingsProps {
  workspaceId: string;
  workspaceName: string;
}

export function WorkspaceSettings({ workspaceId, workspaceName }: WorkspaceSettingsProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(workspaceName);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { updateWorkspace, deleteWorkspace } = useWorkspaces();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateWorkspace.mutateAsync({ id: workspaceId, name });
      toast.success("Workspace updated successfully");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update workspace");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWorkspace.mutateAsync(workspaceId);
      toast.success("Workspace deleted successfully");
      setDeleteOpen(false);
    } catch (error) {
      toast.error("Failed to delete workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Edit Workspace</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Workspace Settings
            </DialogTitle>
            <DialogDescription>
              Make changes to your workspace here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete Workspace</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete Workspace
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workspace? All data will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Dialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
            >
              <Button type="submit" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Deletion
              </Button>
            </Dialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
