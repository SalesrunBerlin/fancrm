
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { createPublicRecord } from "@/services/publicActionService";
import { toast } from "sonner";
import { FormFieldRenderer } from "./FormField";
import { LoadingButton } from "./LoadingButton";
import { SubmissionSuccess } from "./SubmissionSuccess";
import { buildFormSchema } from "./utils/formSchemaUtils";

interface PublicRecordFormProps {
  objectTypeId: string;
  objectFields: Array<{
    id: string;
    api_name: string;
    name: string;
    data_type: string;
    is_required: boolean;
    options?: any;
    default_value?: any;
  }>;
  actionFields: Array<{
    id: string;
    field_id: string;
    is_preselected: boolean;
    is_enabled: boolean;
    default_value?: string | null;
    display_order: number;
  }>;
  onSuccess?: () => void;
}

export function PublicRecordForm({ 
  objectTypeId, 
  objectFields, 
  actionFields,
  onSuccess 
}: PublicRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Filter fields based on action configuration
  const enabledFields = objectFields.filter(field => {
    const actionField = actionFields.find(af => af.field_id === field.id);
    return actionField && actionField.is_enabled;
  });

  // Sort fields by display_order from actionFields
  const sortedFields = [...enabledFields].sort((a, b) => {
    const aOrder = actionFields.find(af => af.field_id === a.id)?.display_order || 0;
    const bOrder = actionFields.find(af => af.field_id === b.id)?.display_order || 0;
    return aOrder - bOrder;
  });

  // Get default values from actionFields
  const defaultValues: Record<string, any> = {};
  sortedFields.forEach(field => {
    const actionField = actionFields.find(af => af.field_id === field.id);
    if (actionField && actionField.default_value) {
      defaultValues[field.api_name] = actionField.default_value;
    } else if (field.default_value) {
      defaultValues[field.api_name] = field.default_value;
    }
  });

  // Create dynamic form schema based on fields
  const formSchema = buildFormSchema(sortedFields);

  // Create form with react-hook-form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      await createPublicRecord(objectTypeId, values);
      toast.success("Record created successfully");
      setIsSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating record:", error);
      toast.error("Failed to create record", {
        description: error.message || "Please try again later"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    form.reset(defaultValues);
  };

  if (isSuccess) {
    return <SubmissionSuccess onSubmitAnother={handleReset} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {sortedFields.map((field) => {
          const actionField = actionFields.find(af => af.field_id === field.id);
          const isEnabled = actionField?.is_enabled || false;
          
          if (!isEnabled) return null;

          return <FormFieldRenderer key={field.id} field={field} form={form} />;
        })}
        
        <LoadingButton 
          isLoading={isSubmitting}
          text="Submit"
          loadingText="Submitting..."
        />
      </form>
    </Form>
  );
}
