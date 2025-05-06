
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { CreateRecordForm } from "@/components/actions/CreateRecordForm";
import { Action } from "@/hooks/useActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useActionFields } from "@/hooks/useActionFields";

interface PublicActionPageContentProps {
  action: Action;
}

export function PublicActionPageContent({ action }: PublicActionPageContentProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { fields: objectFields } = useObjectFields(action.target_object_id);
  const { fields: actionFields } = useActionFields(action.id);

  const handleSubmit = async (formData: any) => {
    try {
      setSubmitting(true);
      
      // Insert record
      const { data: recordData, error: recordError } = await supabase
        .from('object_records')
        .insert({
          object_type_id: action.target_object_id,
          owner_id: action.owner_id,
        })
        .select()
        .single();
      
      if (recordError) {
        toast.error("Failed to create record");
        throw recordError;
      }

      // Insert field values
      const fieldValues = Object.entries(formData).map(([field_api_name, value]) => ({
        record_id: recordData.id,
        field_api_name,
        value: String(value)
      }));
      
      // Insert values
      const { error: valuesError } = await supabase
        .from('object_field_values')
        .insert(fieldValues);
      
      if (valuesError) {
        toast.error("Failed to save field values");
        throw valuesError;
      }
      
      // Success
      setSuccess(true);
      toast.success("Record created successfully");
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error("Error submitting public form:", error);
      toast.error("Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className={getAlertVariantClass("default")}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Thank you! Your submission has been received.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Specifically for new_record action type
  if (action.action_type === "new_record") {
    return (
      <div className="space-y-4">
        <CreateRecordForm 
          objectTypeId={action.target_object_id}
          objectFields={objectFields || []}
          actionFields={actionFields || []}
          onSuccess={() => {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);
          }}
        />
      </div>
    );
  }

  return (
    <Alert className={getAlertVariantClass("destructive")}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        This action type is not supported for public forms.
      </AlertDescription>
    </Alert>
  );
}
