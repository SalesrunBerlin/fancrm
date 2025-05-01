import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplications } from "@/hooks/useApplications";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PublishingConfigDialogProps {
  objectTypeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function PublishingConfigDialog({
  objectTypeId,
  open,
  onOpenChange,
  onComplete
}: PublishingConfigDialogProps) {
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const { applications, isLoading: isLoadingApps } = useApplications();
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (fields) {
      const initialSelection: Record<string, boolean> = {};
      fields.forEach((field) => {
        initialSelection[field.id] = true; // Default all fields to selected
      });
      setSelectedFields(initialSelection);
    }
  }, [fields]);
  
  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };
  
  const toggleApplication = (applicationId: string) => {
    setSelectedApplications(prev => {
      const exists = prev.includes(applicationId);
      if (exists) {
        return prev.filter(id => id !== applicationId);
      } else {
        return [...prev, applicationId];
      }
    });
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      // First, update the object_type
      const { data: updatedObject, error: objectError } = await supabase
        .from("object_types")
        .update({ is_published: true })
        .eq("id", objectTypeId)
        .select()
        .single();

      if (objectError) throw objectError;

      // Then, create the field publishing settings
      const fieldPublishingData = Object.entries(selectedFields).map(
        ([fieldId, isIncluded]) => ({
          object_type_id: objectTypeId,
          field_id: fieldId,
          is_included: isIncluded,
        })
      );

      const { error: publishingError } = await supabase
        .from("object_field_publishing")
        .upsert(fieldPublishingData, { onConflict: 'object_type_id,field_id' });

      if (publishingError) throw publishingError;
      
      // Create recommended application assignments if selected
      if (selectedApplications.length > 0) {
        const recommendationData = selectedApplications.map(appId => ({
          object_type_id: objectTypeId,
          application_id: appId,
          owner_id: updatedObject.owner_id,
        }));
        
        const { error: recommendationError } = await supabase
          .from("object_application_assignments")
          .upsert(recommendationData, { onConflict: 'object_type_id,application_id' });
          
        if (recommendationError) throw recommendationError;
      }

      return updatedObject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      toast.success("Published Successfully", {
        description: "The object is now publicly available for import by other users."
      });
      
      onOpenChange(false);
      if (onComplete) onComplete();
    },
    onError: (error: any) => {
      console.error("Error publishing object:", error);
      toast.error("Publication Failed", {
        description: error.message || "There was an error publishing this object."
      });
    },
  });

  const isLoading = isLoadingFields || isLoadingApps || publishMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(value) => {
      // Don't allow closing the dialog while the publish operation is in progress
      if (!publishMutation.isPending) {
        onOpenChange(value);
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish Object Structure</DialogTitle>
          <DialogDescription>
            Configure which fields to include in the published structure. Published objects can be imported by any user.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium">Fields to Include</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allFieldIds = fields?.map(field => field.id) || [];
                    const areAllSelected = allFieldIds.every(id => selectedFields[id]);
                    
                    const updatedSelection = {...selectedFields};
                    allFieldIds.forEach(fieldId => {
                      updatedSelection[fieldId] = !areAllSelected;
                    });
                    
                    setSelectedFields(updatedSelection);
                  }}
                >
                  {fields && Object.values(selectedFields).filter(Boolean).length === fields.length 
                    ? "Deselect All"
                    : "Select All"
                  }
                </Button>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {fields?.map((field: ObjectField) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${field.id}`}
                        checked={selectedFields[field.id] || false}
                        onCheckedChange={() => toggleField(field.id)}
                      />
                      <Label
                        htmlFor={`field-${field.id}`}
                        className="text-sm flex-1"
                      >
                        {field.name} ({field.api_name})
                        {field.is_system && (
                          <span className="ml-1 text-xs text-muted-foreground">(System)</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recommended Applications</Label>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {applications?.map((app) => (
                    <div key={app.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`app-${app.id}`}
                        checked={selectedApplications.includes(app.id)}
                        onCheckedChange={() => toggleApplication(app.id)}
                      />
                      <Label htmlFor={`app-${app.id}`} className="text-sm flex-1">
                        {app.name}
                        {app.is_default && (
                          <span className="ml-1 text-xs text-muted-foreground">(Default)</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Recommended applications will be suggested to users when they import this object.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={publishMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => publishMutation.mutate()}
            disabled={
              isLoading || 
              Object.values(selectedFields).filter(Boolean).length === 0 ||
              publishMutation.isPending
            }
          >
            {publishMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish Object
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
