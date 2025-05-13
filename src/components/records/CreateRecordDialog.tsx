
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { RecordField } from "./RecordField";
import { useEnhancedFields } from "@/hooks/useEnhancedFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { RecordFormData } from "@/types"; // Import from @/types instead of @/lib/types/records
import { Loader2 } from "lucide-react";
import { generateAutoNumber } from "@/hooks/useAutoNumberFields";
import { toast } from "sonner";
import { ThemedButton } from "@/components/ui/themed-button";
import { useAuth } from "@/contexts/AuthContext";
import { ActionColor } from "@/hooks/useActions";
import { useObjectLayout } from "@/hooks/useObjectLayout";

interface CreateRecordDialogProps {
  objectTypeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRecordDialog({ objectTypeId, open, onOpenChange }: CreateRecordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { objectTypes } = useObjectTypes();
  const { fields: unsortedFields, isLoading: isLoadingFields } = useEnhancedFields(objectTypeId);
  const { createRecord } = useObjectRecords(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const form = useForm<RecordFormData>();
  const { favoriteColor } = useAuth();
  
  // Use layout configuration to order fields
  const { applyLayout, isLoading: isLoadingLayout } = useObjectLayout(objectTypeId);
  
  // Apply layout to field order
  const fields = applyLayout(unsortedFields || []);

  const onSubmit = async (data: RecordFormData) => {
    try {
      setIsSubmitting(true);
      
      // Process auto-number fields
      const autoNumberFields = fields.filter(f => f.data_type === 'auto_number');
      
      for (const field of autoNumberFields) {
        try {
          const autoNumberValue = await generateAutoNumber(field.id);
          // Add the auto-number value to the form data
          data[field.api_name] = autoNumberValue;
        } catch (error) {
          console.error(`Failed to generate auto-number for field ${field.api_name}:`, error);
          toast.error(`Failed to generate auto-number for field ${field.name}`);
        }
      }
      
      // Create the record with field values
      await createRecord.mutateAsync({
        field_values: data
      });
      
      form.reset();
      onOpenChange(false);
      toast.success("Record created successfully");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to create record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!objectType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New {objectType.name}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isLoadingFields || isLoadingLayout ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field) => (
                  <RecordField
                    key={field.id}
                    field={field}
                    form={form}
                  />
                ))}
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-2">
              <ThemedButton 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </ThemedButton>
              <ThemedButton 
                type="submit" 
                disabled={isSubmitting} 
                variant={(favoriteColor as ActionColor) || "default"}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </ThemedButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
