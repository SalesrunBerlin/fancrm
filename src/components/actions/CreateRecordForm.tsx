
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
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";

interface CreateRecordFormProps {
  objectTypeId: string;
  objectFields: ObjectField[];
  actionFields: ActionFieldWithDetails[];
  initialValues?: Record<string, any>; // Added for linked actions
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
  initialValues = {},
  onSuccess,
}: CreateRecordFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupFieldsValues, setLookupFieldsValues] = useState<Record<string, Record<string, any>>>({});
  const [enhancedFields, setEnhancedFields] = useState<ObjectField[]>([]);
  const [formulaWarnings, setFormulaWarnings] = useState<Record<string, string>>({});
  
  // Filter only enabled fields or fields that are required by the object
  const enabledActionFields = actionFields.filter(af => 
    af.is_enabled || af.is_required
  );
  
  // Get the corresponding object fields that are enabled
  const enabledObjectFields = objectFields.filter(objField => 
    enabledActionFields.some(af => af.field_id === objField.id) || objField.is_required
  );
  
  // Enhance picklist fields with their values
  useEffect(() => {
    const enhancePicklistFields = async () => {
      const picklistFields = enabledObjectFields.filter(field => field.data_type === 'picklist');
      
      if (picklistFields.length === 0) {
        setEnhancedFields([...enabledObjectFields]);
        return;
      }
      
      const enhanced = [...enabledObjectFields];
      
      for (const field of picklistFields) {
        try {
          const { data } = await supabase
            .from("field_picklist_values")
            .select("*")
            .eq("field_id", field.id)
            .order("order_position");
            
          if (data && data.length > 0) {
            const fieldIndex = enhanced.findIndex(f => f.id === field.id);
            if (fieldIndex !== -1) {
              enhanced[fieldIndex] = {
                ...enhanced[fieldIndex],
                options: {
                  values: data.map(item => ({
                    value: item.value,
                    label: item.label
                  }))
                }
              };
            }
          }
        } catch (err) {
          console.error(`Error fetching picklist values for field ${field.id}:`, err);
        }
      }
      
      setEnhancedFields(enhanced);
    };
    
    enhancePicklistFields();
  }, [enabledObjectFields]);
  
  // Build form schema based on fields
  const formSchema = buildFormSchema(enabledObjectFields);
  
  // Prepare default values from action fields and initialValues
  const defaultValues: Record<string, any> = { ...initialValues };
  
  // Create form with the schema and default values
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Important: Initialize formula-based default values when the form first loads
  useEffect(() => {
    if (enabledActionFields.length > 0 && objectFields.length > 0) {
      console.log("Evaluating formula-based default values on form load");
      
      const formulaDefaults: Record<string, any> = {};
      const newFormulaWarnings: Record<string, string> = {};
      let hasFormulaValues = false;
      
      // Process action fields to set default values with formulas
      enabledActionFields.forEach(actionField => {
        const field = objectFields.find(f => f.id === actionField.field_id);
        if (field) {
          // Skip if we already have an initial value for this field
          if (defaultValues[field.api_name]) return;
          
          // Check if this field has a formula
          if (actionField.formula_type === 'dynamic' && actionField.formula_expression) {
            const formulaValue = evaluateFormula(
              actionField.formula_expression,
              { 
                fieldValues: form.getValues(),
                lookupFieldsValues
              }
            );
            
            console.log(`Evaluating formula for ${field.api_name}:`, 
              actionField.formula_expression, "-->", formulaValue);
            
            // Check if the formula returned null (unresolved)
            if (formulaValue === null && actionField.formula_expression) {
              newFormulaWarnings[field.api_name] = 
                `Formula could not be resolved: ${actionField.formula_expression}`;
              
              // Use empty string instead of null for form fields
              formulaDefaults[field.api_name] = '';
            } else {
              formulaDefaults[field.api_name] = formulaValue || '';
            }
            
            hasFormulaValues = true;
          } 
          // Otherwise use the static default value
          else if (actionField.default_value) {
            formulaDefaults[field.api_name] = actionField.default_value;
            hasFormulaValues = true;
          }
        }
      });
      
      // Update formula warnings
      if (Object.keys(newFormulaWarnings).length > 0) {
        setFormulaWarnings(newFormulaWarnings);
      }
      
      // Set all formula values at once if we have any
      if (hasFormulaValues) {
        console.log("Setting formula default values:", formulaDefaults);
        Object.entries(formulaDefaults).forEach(([fieldName, value]) => {
          form.setValue(fieldName, value);
        });
      }
    }
  }, [enabledActionFields, objectFields, form]);
  
  useEffect(() => {
    // First, collect all lookup fields that have values
    const lookupFields = enabledObjectFields
      .filter(field => field.data_type === 'lookup');
      
    const lookupFieldsWithValues = new Set<string>();

    // Check which lookup fields have values in the form
    lookupFields.forEach(field => {
      const actionField = actionFields.find(af => af.field_id === field.id);
      if (actionField && form.getValues(field.api_name)) {
        lookupFieldsWithValues.add(field.api_name);
      }
    });

    // If we have any lookup fields with values, fetch their details
    if (lookupFieldsWithValues.size > 0) {
      const fetchLookupFieldsValues = async () => {
        const newLookupValues: Record<string, Record<string, any>> = {};
        
        for (const fieldApiName of lookupFieldsWithValues) {
          const field = objectFields.find(f => f.api_name === fieldApiName);
          if (!field || !field.options) continue;
          
          let targetObjectTypeId = '';
          
          if (typeof field.options === 'object') {
            targetObjectTypeId = (field.options as any).target_object_type_id || '';
          } else if (typeof field.options === 'string') {
            try {
              targetObjectTypeId = JSON.parse(field.options).target_object_type_id || '';
            } catch (e) {
              console.error("Error parsing field options:", e);
            }
          }
          
          if (!targetObjectTypeId) continue;
          
          const recordId = form.getValues(fieldApiName);
          if (!recordId) continue;
          
          try {
            // Fetch the record values
            const { data: fieldValues } = await supabase
              .from('object_field_values')
              .select('field_api_name, value')
              .eq('record_id', recordId);
              
            if (fieldValues && fieldValues.length > 0) {
              const valuesObj = fieldValues.reduce((acc, val) => {
                acc[val.field_api_name] = val.value;
                return acc;
              }, {} as Record<string, any>);
              
              newLookupValues[fieldApiName] = valuesObj;
            }
          } catch (err) {
            console.error(`Error fetching values for lookup field ${fieldApiName}:`, err);
          }
        }
        
        setLookupFieldsValues(newLookupValues);
      };
      
      fetchLookupFieldsValues();
    }
  }, [objectFields, actionFields, form, enabledObjectFields]);

  // Update form values when lookup values change
  useEffect(() => {
    if (Object.keys(lookupFieldsValues).length > 0) {
      const newFormulaWarnings: Record<string, string> = {};
      
      // Re-evaluate formulas with the new lookup values
      enabledActionFields.forEach(actionField => {
        const field = objectFields.find(f => f.id === actionField.field_id);
        if (field && actionField.formula_type === 'dynamic' && actionField.formula_expression) {
          const formulaValue = evaluateFormula(
            actionField.formula_expression, 
            { 
              fieldValues: form.getValues(), 
              lookupFieldsValues 
            }
          );
          
          // Check if the formula returned null (unresolved)
          if (formulaValue === null && actionField.formula_expression) {
            newFormulaWarnings[field.api_name] = 
              `Formula could not be resolved: ${actionField.formula_expression}`;
            
            // Use empty string instead of null for form fields
            form.setValue(field.api_name, '');
          } else {
            form.setValue(field.api_name, formulaValue || '');
          }
        }
      });
      
      // Update formula warnings
      setFormulaWarnings(prev => ({...prev, ...newFormulaWarnings}));
    }
  }, [lookupFieldsValues, enabledActionFields, objectFields, form]);

  // Get pre-selected fields
  const preselectedFields = enabledActionFields
    .filter(f => f.is_preselected)
    .map(actionField => {
      const field = enhancedFields.find(f => f.id === actionField.field_id);
      return field;
    })
    .filter(Boolean) as ObjectField[];
  
  // Get the remaining fields
  const remainingFields = enhancedFields.filter(field => 
    !preselectedFields.some(pf => pf.id === field.id)
  );

  // Validate if all formulas are resolved
  const validateFormFormulas = () => {
    const fieldValues = form.getValues();
    const newFormulaWarnings: Record<string, string> = {};
    let hasUnresolvedFormulas = false;
    
    // Check all formula fields
    enabledActionFields.forEach(actionField => {
      const field = objectFields.find(f => f.id === actionField.field_id);
      if (field && actionField.formula_type === 'dynamic' && actionField.formula_expression) {
        // If field is required but value is empty or still has formula syntax
        const value = fieldValues[field.api_name];
        if (field.is_required && (!value || value === '')) {
          if (actionField.formula_expression.includes('.')) {
            // It's a lookup formula that likely failed
            newFormulaWarnings[field.api_name] = 
              `Required formula field could not be resolved: ${actionField.formula_expression}`;
            hasUnresolvedFormulas = true;
          }
        }
      }
    });
    
    // Update formula warnings
    if (Object.keys(newFormulaWarnings).length > 0) {
      setFormulaWarnings(prev => ({...prev, ...newFormulaWarnings}));
    }
    
    return !hasUnresolvedFormulas;
  };

  const handleSubmit = async (data: Record<string, any>) => {
    if (!user) {
      setError("You must be logged in to create records");
      return;
    }
    
    // Validate formula fields
    if (!validateFormFormulas()) {
      setError("Some required formula fields could not be resolved. Please check the form for details.");
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
        value: value === undefined || value === null ? null : String(value),
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
        
        {Object.keys(formulaWarnings).length > 0 && (
          <Alert className={getAlertVariantClass("warning")}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div>Some formula fields may need attention:</div>
              <ul className="list-disc pl-5 text-sm mt-1">
                {Object.entries(formulaWarnings).map(([fieldName, warning]) => {
                  const field = objectFields.find(f => f.api_name === fieldName);
                  return (
                    <li key={fieldName} className="mt-1">
                      <span className="font-semibold">{field?.name || fieldName}</span>: {warning}
                    </li>
                  );
                })}
              </ul>
            </AlertDescription>
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
