import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { ActionFieldWithDetails } from "@/hooks/useActionFields";
import { RecordField } from "@/components/records/RecordField";
import { ObjectField } from "@/hooks/useObjectTypes";
import { evaluateFormula } from "@/utils/formulaEvaluator";

interface CreateRecordFormProps {
  objectTypeId: string;
  objectFields: ObjectField[];
  actionFields: ActionFieldWithDetails[];
  onSuccess: () => void;
}

// Dynamic schema builder
const buildFormSchema = (fields: ObjectField[]) => {
  const schemaObj: Record<string, any> = {};

  fields.forEach((field) => {
    // Start with a base schema based on field type
    let validator: z.ZodTypeAny = z.string();

    if (field.is_required) {
      validator = z.string().min(1, { message: `${field.name} is required` });
    } else {
      // For optional fields
      validator = z.string().optional();
    }

    schemaObj[field.api_name] = validator;
  });

  return z.object(schemaObj);
};

export function CreateRecordForm({
  objectTypeId,
  objectFields,
  actionFields,
  onSuccess,
}: CreateRecordFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Build form schema based on fields
  const formSchema = buildFormSchema(objectFields);
  
  // Prepare default values from action fields
  const defaultValues: Record<string, any> = {};
  
  actionFields.forEach(actionField => {
    const field = objectFields.find(f => f.id === actionField.field_id);
    if (field) {
      // Check if this field has a formula
      if (actionField.formula_type === 'dynamic' && actionField.formula_expression) {
        defaultValues[field.api_name] = evaluateFormula(actionField.formula_expression);
      } 
      // Otherwise use the static default value
      else if (actionField.default_value) {
        defaultValues[field.api_name] = actionField.default_value;
      }
    }
  });
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Get pre-selected fields
  const preselectedFields = actionFields
    .filter(f => f.is_preselected)
    .map(actionField => {
      const field = objectFields.find(f => f.id === actionField.field_id);
      return field;
    })
    .filter(Boolean) as ObjectField[];
  
  // Get the remaining fields
  const remainingFields = objectFields.filter(field => 
    !preselectedFields.some(pf => pf.id === field.id)
  );

  const handleSubmit = async (data: Record<string, any>) => {
    if (!user) {
      setError("You must be logged in to create records");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create the record
      const { data: record, error: recordError } = await supabase
        .from("object_records")
        .insert({
          object_type_id: objectTypeId,
          owner_id: user.id,
        })
        .select()
        .single();
      
      if (recordError) throw recordError;
      
      // Create the field values
      const fieldValues = Object.entries(data).map(([api_name, value]) => ({
        record_id: record.id,
        field_api_name: api_name,
        value: value === undefined ? null : String(value),
      }));
      
      const { error: valuesError } = await supabase
        .from("object_field_values")
        .insert(fieldValues);
      
      if (valuesError) throw valuesError;
      
      toast.success("Record created successfully");
      onSuccess();
    } catch (err: any) {
      console.error("Error creating record:", err);
      setError(err.message || "Failed to create record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <Alert className={getAlertVariantClass("destructive")}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {preselectedFields.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Pre-selected Fields
            </h3>
            
            <div className="space-y-4 p-4 border rounded-md bg-muted/30">
              {preselectedFields.map((field) => (
                <RecordField
                  key={field.id}
                  field={field}
                  form={form}
                />
              ))}
            </div>
          </div>
        )}
        
        {remainingFields.length > 0 && (
          <div className="space-y-4">
            {preselectedFields.length > 0 && (
              <Separator className="my-6" />
            )}
            
            <h3 className="text-sm font-medium text-muted-foreground">
              Other Fields
            </h3>
            
            <div className="space-y-4">
              {remainingFields.map((field) => (
                <RecordField
                  key={field.id}
                  field={field}
                  form={form}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Record"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
