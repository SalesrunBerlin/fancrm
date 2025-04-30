
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useObjectFields } from "@/hooks/useObjectFields";
import { supabase } from "@/integrations/supabase/client";
import { ObjectField } from "@/hooks/useObjectTypes";
import { Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useObjectTypes } from "@/hooks/useObjectTypes";

interface PublishingConfigProps {
  objectTypeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type FieldPublishStatus = {
  fieldId: string;
  name: string;
  apiName: string;
  isIncluded: boolean;
};

export function PublishingConfigDialog({ 
  objectTypeId, 
  open, 
  onOpenChange,
  onComplete 
}: PublishingConfigProps) {
  const { toast } = useToast();
  const { fields } = useObjectFields(objectTypeId);
  const [fieldPublishStatus, setFieldPublishStatus] = useState<FieldPublishStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { publishObjectType } = useObjectTypes();

  // Load existing publishing settings
  useEffect(() => {
    if (!open || !objectTypeId || !fields) return;
    
    const loadPublishingSettings = async () => {
      setIsLoading(true);
      
      try {
        // Get existing publishing settings
        const { data: existingSettings, error } = await supabase
          .from('object_field_publishing')
          .select('*')
          .eq('object_type_id', objectTypeId);
          
        if (error) throw error;
        
        // Map fields with their publishing status
        const statusMap = new Map();
        existingSettings?.forEach(setting => {
          statusMap.set(setting.field_id, setting.is_included);
        });
        
        const fieldStatuses = fields.map(field => ({
          fieldId: field.id,
          name: field.name,
          apiName: field.api_name,
          isIncluded: statusMap.has(field.id) ? statusMap.get(field.id) : true
        }));
        
        setFieldPublishStatus(fieldStatuses);
      } catch (error) {
        console.error("Error loading publishing settings:", error);
        toast({
          title: "Error",
          description: "Failed to load publishing settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPublishingSettings();
  }, [objectTypeId, fields, open, toast]);

  // Toggle field inclusion
  const toggleFieldInclusion = (fieldId: string) => {
    setFieldPublishStatus(current => 
      current.map(field => 
        field.fieldId === fieldId 
          ? { ...field, isIncluded: !field.isIncluded } 
          : field
      )
    );
  };

  // Toggle all fields
  const toggleAllFields = (value: boolean) => {
    setFieldPublishStatus(current => 
      current.map(field => ({ ...field, isIncluded: value }))
    );
  };

  // Save publishing settings
  const savePublishingSettings = async () => {
    setIsSaving(true);
    
    try {
      // Upsert publishing settings
      const upsertData = fieldPublishStatus.map(field => ({
        object_type_id: objectTypeId,
        field_id: field.fieldId,
        is_included: field.isIncluded
      }));
      
      const { error } = await supabase
        .from('object_field_publishing')
        .upsert(upsertData, { onConflict: 'object_type_id,field_id' });
      
      if (error) throw error;
      
      // Publish the object type
      await publishObjectType.mutateAsync(objectTypeId);
      
      toast({
        title: "Success",
        description: "Object type published successfully",
      });
      
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving publishing settings:", error);
      toast({
        title: "Error",
        description: "Failed to save publishing settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if all fields are included
  const allFieldsIncluded = fieldPublishStatus.length > 0 && 
    fieldPublishStatus.every(field => field.isIncluded);

  // Check if some fields are included
  const someFieldsIncluded = fieldPublishStatus.some(field => field.isIncluded);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Configure Publishing Settings</DialogTitle>
          <DialogDescription>
            Select which fields to include when publishing this object type.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all"
                checked={allFieldsIncluded}
                onCheckedChange={checked => toggleAllFields(!!checked)}
              />
              <label 
                htmlFor="select-all" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select All Fields
              </label>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Include</TableHead>
                  <TableHead>Field Name</TableHead>
                  <TableHead>API Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fieldPublishStatus.map((field) => (
                  <TableRow key={field.fieldId}>
                    <TableCell>
                      <Checkbox 
                        checked={field.isIncluded}
                        onCheckedChange={() => toggleFieldInclusion(field.fieldId)}
                      />
                    </TableCell>
                    <TableCell>{field.name}</TableCell>
                    <TableCell>{field.apiName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={savePublishingSettings}
            disabled={isSaving || !someFieldsIncluded || isLoading}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Publishing..." : "Publish Object Type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
