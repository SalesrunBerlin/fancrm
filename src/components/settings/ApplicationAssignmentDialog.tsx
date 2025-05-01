
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplications } from "@/hooks/useApplications";
import { useObjectApplicationAssignments } from "@/hooks/useObjectApplicationAssignments";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApplicationAssignmentDialogProps {
  objectTypeId: string;
  objectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function ApplicationAssignmentDialog({
  objectTypeId,
  objectName,
  open,
  onOpenChange,
  onComplete
}: ApplicationAssignmentDialogProps) {
  const { applications, isLoading: isLoadingApps } = useApplications();
  const { 
    assignments, 
    isLoading: isLoadingAssignments,
    assignObjectToApplication,
    removeObjectFromApplication,
    getUnassignedApplications 
  } = useObjectApplicationAssignments(objectTypeId);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("");
  const [unassignedApplications, setUnassignedApplications] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (open) {
      refreshUnassignedApplications();
    }
  }, [open, assignments]);

  const refreshUnassignedApplications = async () => {
    try {
      setIsRefreshing(true);
      const unassigned = await getUnassignedApplications();
      setUnassignedApplications(unassigned);
      setSelectedApplicationId(""); // Reset selection
    } catch (error) {
      console.error("Error loading unassigned applications:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedApplicationId) {
      toast.error("Please select an application");
      return;
    }
    
    try {
      await assignObjectToApplication.mutateAsync({
        objectTypeId,
        applicationId: selectedApplicationId
      });
      refreshUnassignedApplications();
    } catch (error) {
      console.error("Error assigning to application:", error);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    try {
      await removeObjectFromApplication.mutateAsync(assignmentId);
      refreshUnassignedApplications();
    } catch (error) {
      console.error("Error removing from application:", error);
    }
  };

  const isLoading = isLoadingApps || isLoadingAssignments || isRefreshing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Object to Applications</DialogTitle>
          <DialogDescription>
            Assign <strong>{objectName}</strong> to one or more applications.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Current Assignments</h3>
                {assignments && assignments.length > 0 ? (
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {assignments.map((assignment) => (
                        <div 
                          key={assignment.id} 
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div className="flex flex-col">
                            <span>{assignment.application?.name}</span>
                            {assignment.application?.is_default && (
                              <Badge variant="secondary" className="w-fit mt-1">Default</Badge>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemove(assignment.id)}
                            disabled={removeObjectFromApplication.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This object is not assigned to any applications.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Add to Application</h3>
                {unassignedApplications.length > 0 ? (
                  <div className="flex gap-2">
                    <Select 
                      value={selectedApplicationId} 
                      onValueChange={setSelectedApplicationId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select an application" />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedApplications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.name} {app.is_default && "(Default)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAssign} 
                      disabled={!selectedApplicationId || assignObjectToApplication.isPending}
                    >
                      {assignObjectToApplication.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The object is assigned to all available applications.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => {
                onOpenChange(false);
                if (onComplete) onComplete();
              }}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
