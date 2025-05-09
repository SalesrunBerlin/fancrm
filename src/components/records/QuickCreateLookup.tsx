
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useEnhancedFields } from "@/hooks/useEnhancedFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { RecordField } from "./RecordField";
import { toast } from "sonner";
import { generateAutoNumber } from "@/hooks/useAutoNumberFields";

interface QuickCreateLookupProps {
  targetObjectTypeId: string;
  onRecordCreated: (recordId: string, displayName: string) => void;
  buttonVariant?: "default" | "outline" | "ghost";
  buttonSize?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export function QuickCreateLookup({
  targetObjectTypeId,
  onRecordCreated,
  buttonVariant = "outline",
  buttonSize = "sm",
  className = "",
  label = "Create New",
  showLabel = true,
}: QuickCreateLookupProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useEnhancedFields(targetObjectTypeId);
  const { createRecord } = useObjectRecords(targetObjectTypeId);
  const objectType = objectTypes?.find(type => type.id === targetObjectTypeId);
  const form = useForm();

  // Filter fields to only show required fields and name/title for quick creation
  const quickCreateFields = fields?.filter(field => 
    field.is_required || 
    field.api_name === 'name' || 
    field.api_name === 'title' ||
    objectType?.default_field_api_name === field.api_name
  ).slice(0, 5) || [];

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Process auto-number fields
      const autoNumberFields = fields?.filter(f => f.data_type === 'auto_number') || [];
      
      for (const field of autoNumberFields) {
        try {
          const autoNumberValue = await generateAutoNumber(field.id);
          // Add the auto-number value to the form data
          data[field.api_name] = autoNumberValue;
        } catch (error) {
          console.error(`Failed to generate auto-number for field ${field.api_name}:`, error);
        }
      }
      
      // Create the record with field values
      const result = await createRecord.mutateAsync({
        field_values: data
      });
      
      // Determine display name for the created record
      let displayName = "";
      if (objectType?.default_field_api_name && data[objectType.default_field_api_name]) {
        displayName = data[objectType.default_field_api_name];
      } else if (data.name) {
        displayName = data.name;
      } else if (data.title) {
        displayName = data.title;
      } else {
        displayName = result.record_id;
      }
      
      // Reset form and close dialog
      form.reset();
      setIsDialogOpen(false);
      
      // Notify parent component of the new record
      onRecordCreated(result.id, displayName);
      toast.success(`New ${objectType?.name || "record"} created`);
    } catch (error) {
      console.error("Error creating record:", error);
      toast.error("Failed to create record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className={className}
        onClick={handleOpenDialog}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        {showLabel && label}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New {objectType?.name || "Record"}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {isLoadingFields ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {quickCreateFields.map((field) => (
                    <RecordField
                      key={field.id}
                      field={field}
                      form={form}
                    />
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
