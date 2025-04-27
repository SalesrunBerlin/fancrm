
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ObjectField } from "@/hooks/useObjectTypes";
import { fieldEditSchema, FieldEditFormData } from "@/components/settings/schemas/fieldEditSchema";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useQueryClient } from "@tanstack/react-query";

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
      name: field.name,
      api_name: field.api_name,
      display_field_api_name: field.options?.display_field_api_name,
    },
  });

  const onSubmit = async (values: FieldEditFormData) => {
    try {
      setIsSubmitting(true);

      const updatedOptions = {
        ...field.options,
        display_field_api_name: values.display_field_api_name,
      };

      await updateField.mutateAsync({
        id: field.id,
        name: field.is_system ? field.name : values.name,
        api_name: values.api_name,
        options: updatedOptions,
      });
      
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ["object-fields", field.object_type_id] });
      queryClient.invalidateQueries({ queryKey: ["object-record"] });
      
      onClose();
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
