
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ObjectField } from "@/hooks/useObjectTypes";
import { fieldEditSchema, FieldEditFormData } from "@/components/settings/schemas/fieldEditSchema";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseObjectFieldEditProps {
  field: ObjectField;
  onClose: () => void;
}

export function useObjectFieldEdit({ field, onClose }: UseObjectFieldEditProps) {
  const { updateField } = useObjectFields(field.object_type_id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FieldEditFormData>({
    resolver: zodResolver(fieldEditSchema),
    defaultValues: {
      name: field.name || '',
      api_name: field.api_name || '',
      display_field_api_name: field.options?.display_field_api_name || '',
      target_object_type_id: field.options?.target_object_type_id || '',
    },
  });

  const onSubmit = async (values: FieldEditFormData) => {
    try {
      setIsSubmitting(true);
      console.log('Submitting field edit:', values);

      const updatedOptions = {
        ...field.options,
        display_field_api_name: values.display_field_api_name,
        target_object_type_id: values.target_object_type_id,
      };

      console.log('Updated options:', updatedOptions);

      await updateField.mutateAsync({
        id: field.id,
        name: values.name,
        api_name: values.api_name,
        options: updatedOptions,
      });
      
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ["object-fields", field.object_type_id] });
      queryClient.invalidateQueries({ queryKey: ["object-record"] });
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      
      toast.success("Field updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error("Failed to update field");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
