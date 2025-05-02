
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

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

  const handleToggleObject = async (objectTypeId: string, isAssigned: boolean) => {
    if (!user) return;
    
    try {
      setIsAssigning(true);
      
      if (isAssigned) {
        // Remove object
        const { error } = await supabase
          .from("object_application_assignments")
          .delete()
          .eq("application_id", applicationId)
          .eq("object_type_id", objectTypeId);
          
        if (error) throw error;
        
        // Update local state
        setAssignedObjectIds(prev => prev.filter(id => id !== objectTypeId));
        toast.success("Object removed from application");
      } else {
        // Assign object
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
      }
    } catch (error) {
      console.error("Error toggling object:", error);
      toast.error("Failed to update object assignment");
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter objects to show only non-archived ones that the user has access to
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
            <div className="border rounded-md p-4 bg-muted/30">
              <div className="space-y-2">
                {availableObjects.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No available objects found.
                  </div>
                ) : (
                  availableObjects.map((obj) => {
                    const isAssigned = assignedObjectIds.includes(obj.id);
                    
                    return (
                      <div key={obj.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <div className="font-medium">{obj.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {obj.api_name}
                            {obj.is_system && (
                              <Badge variant="secondary" className="ml-2 text-xs">System</Badge>
                            )}
                          </div>
                        </div>
                        
                        <Switch
                          checked={isAssigned}
                          onCheckedChange={() => handleToggleObject(obj.id, isAssigned)}
                          disabled={isAssigning}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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
