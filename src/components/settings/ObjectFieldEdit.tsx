
import React, { useEffect, useState } from "react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ObjectFieldEditFields } from "./ObjectFieldEditFields";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define the form schema
const fieldEditSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  api_name: z.string().min(1, "API name is required"),
  target_object_type_id: z.string().optional(),
  display_field_api_name: z.string().optional(),
});

export type FieldEditFormData = z.infer<typeof fieldEditSchema>;

interface ObjectFieldEditProps {
  field: ObjectField;
  isOpen: boolean;
  onClose: () => void;
}

export function ObjectFieldEdit({ field, isOpen, onClose }: ObjectFieldEditProps) {
  const { objectTypes } = useObjectTypes();
  const targetObjectTypeId = field.options?.target_object_type_id;
  const { fields: targetFields } = useObjectFields(targetObjectTypeId);
  
  // Initialize form with the field data
  const form = useForm<FieldEditFormData>({
    resolver: zodResolver(fieldEditSchema),
    defaultValues: {
      name: field.name,
      api_name: field.api_name,
      target_object_type_id: field.options?.target_object_type_id,
      display_field_api_name: field.options?.display_field_api_name,
    },
  });
  
  // Update form values when field changes
  useEffect(() => {
    if (field) {
      form.reset({
        name: field.name,
        api_name: field.api_name,
        target_object_type_id: field.options?.target_object_type_id,
        display_field_api_name: field.options?.display_field_api_name,
      });
    }
  }, [field, form]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const onSubmit = async (data: FieldEditFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare field options based on field type
      let options = field.options || {};
      
      if (field.data_type === 'lookup') {
        options = {
          ...options,
          target_object_type_id: data.target_object_type_id,
          display_field_api_name: data.display_field_api_name
        };
      }
      
      // Call API to update field (implementation would depend on your app's structure)
      // For example:
      // await updateField({ id: field.id, name: data.name, options });
      
      onClose();
    } catch (error) {
      console.error("Error updating field:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ObjectFieldEditFields 
              form={form}
              field={field}
            />
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
