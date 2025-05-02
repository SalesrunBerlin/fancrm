import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ObjectAssignmentDialogProps {
  applicationId: string;
  applicationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function ObjectAssignmentDialog({
  applicationId,
  applicationName,
  open,
  onOpenChange,
  onComplete
}: ObjectAssignmentDialogProps) {
  const { user } = useAuth();
  const { objectTypes, isLoading: isLoadingObjects } = useObjectTypes();
  const [assignedObjectIds, setAssignedObjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch already assigned objects
  useEffect(() => {
    if (open && applicationId) {
      fetchAssignedObjects();
    }
  }, [open, applicationId]);

  const fetchAssignedObjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("object_application_assignments")
        .select("object_type_id")
        .eq("application_id", applicationId);
        
      if (error) throw error;
      
      setAssignedObjectIds(data.map(item => item.object_type_id) || []);
    } catch (error) {
      console.error("Error fetching assigned objects:", error);
      toast.error("Failed to load assigned objects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignObject = async (objectTypeId: string) => {
    if (!user) return;
    
    try {
      setIsAssigning(true);
      
      const { error } = await supabase
        .from("object_application_assignments")
        .insert({
          application_id: applicationId,
          object_type_id: objectTypeId,
          owner_id: user.id
        });
        
      if (error) throw error;
      
      // Update local state
      setAssignedObjectIds(prev => [...prev, objectTypeId]);
      toast.success("Object assigned to application");
    } catch (error) {
      console.error("Error assigning object:", error);
      toast.error("Failed to assign object");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveObject = async (objectTypeId: string) => {
    try {
      setIsAssigning(true);
      
      const { error } = await supabase
        .from("object_application_assignments")
        .delete()
        .eq("application_id", applicationId)
        .eq("object_type_id", objectTypeId);
        
      if (error) throw error;
      
      // Update local state
      setAssignedObjectIds(prev => prev.filter(id => id !== objectTypeId));
      toast.success("Object removed from application");
    } catch (error) {
      console.error("Error removing object:", error);
      toast.error("Failed to remove object");
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter objects to show only non-archived ones that the user has access to, removed is_active filter
  const availableObjects = objectTypes?.filter(obj => 
    (obj.owner_id === user?.id || obj.is_system) && 
    !obj.is_archived
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Objects for {applicationName}</DialogTitle>
          <DialogDescription>
            Assign or remove objects from this application.
          </DialogDescription>
        </DialogHeader>

        {isLoading || isLoadingObjects ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Object Name</TableHead>
                  <TableHead>API Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableObjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No available objects found.
                    </TableCell>
                  </TableRow>
                ) : (
                  availableObjects.map((obj) => {
                    const isAssigned = assignedObjectIds.includes(obj.id);
                    
                    return (
                      <TableRow key={obj.id}>
                        <TableCell>{obj.name}</TableCell>
                        <TableCell>{obj.api_name}</TableCell>
                        <TableCell>
                          {obj.is_system && (
                            <Badge variant="secondary" className="mr-1">System</Badge>
                          )}
                          {obj.is_active ? (
                            <Badge variant="outline" className="bg-green-50">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={isAssigned ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => isAssigned ? handleRemoveObject(obj.id) : handleAssignObject(obj.id)}
                            disabled={isAssigning}
                          >
                            {isAssigning ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isAssigned ? (
                              "Remove"
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Assign
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button onClick={() => {
            onOpenChange(false);
            if (onComplete) onComplete();
          }}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
