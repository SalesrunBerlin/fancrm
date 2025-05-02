
import { useState, useEffect, useRef } from "react";
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
import { useQueries, useQuery } from "@tanstack/react-query";

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
  const hasInitializedFormulas = useRef(false);
  const hasProcessedLookupFormulas = useRef(false);
  const [isLoadingLookupData, setIsLoadingLookupData] = useState(false);
  const lookupFieldsLoadedRef = useRef<Set<string>>(new Set());
  
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

  // Function to identify lookup fields that need data loading
  const getLookupFieldsWithValues = () => {
    const lookupFields = enabledObjectFields
      .filter(field => field.data_type === 'lookup');
      
    const lookupFieldsWithValues = new Map<string, string>();

    // Check which lookup fields have values in the form
    lookupFields.forEach(field => {
      const fieldValue = form.getValues(field.api_name);
      if (fieldValue && !lookupFieldsLoadedRef.current.has(field.api_name)) {
        lookupFieldsWithValues.set(field.api_name, fieldValue);
      }
    });

    return lookupFieldsWithValues;
  };

  // Function to load lookup field data
  const fetchLookupFieldData = async (fieldApiName: string, recordId: string) => {
    console.log(`Fetching lookup data for field ${fieldApiName}, record ${recordId}`);
    
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
        
        console.log(`Lookup data loaded for ${fieldApiName}:`, valuesObj);
        return valuesObj;
      }
    } catch (err) {
      console.error(`Error fetching values for lookup field ${fieldApiName}:`, err);
    }
    
    return null;
  };

  // Important: Initialize formula-based default values when the form first loads
  useEffect(() => {
    if (!hasInitializedFormulas.current && enabledActionFields.length > 0 && objectFields.length > 0) {
      console.log("Evaluating formula-based default values on initial form load");
      
      const formulaDefaults: Record<string, any> = {};
      let hasFormulaValues = false;
      
      // Process action fields to set default values with formulas
      enabledActionFields.forEach(actionField => {
        const field = objectFields.find(f => f.id === actionField.field_id);
        if (field) {
          // Skip if we already have an initial value for this field
          if (defaultValues[field.api_name]) {
            console.log(`Skipping formula evaluation for ${field.api_name} as it has an initial value:`, defaultValues[field.api_name]);
            return;
          }
          
          // Check if this field has a formula
          if (actionField.formula_type === 'dynamic' && actionField.formula_expression) {
            // Evaluate simple formulas like {Now} and {Today}
            const formulaValue = evaluateFormula(
              actionField.formula_expression,
              { 
                fieldValues: form.getValues(),
                lookupFieldsValues
              }
            );
            
            console.log(`Evaluating formula for ${field.api_name}:`, 
              actionField.formula_expression, "-->", formulaValue);
            
            formulaDefaults[field.api_name] = formulaValue;
            hasFormulaValues = true;
          } 
          // Otherwise use the static default value
          else if (actionField.default_value) {
            formulaDefaults[field.api_name] = actionField.default_value;
            hasFormulaValues = true;
          }
        }
      });
      
      // Set all formula values at once if we have any
      if (hasFormulaValues) {
        console.log("Setting formula default values:", formulaDefaults);
        Object.entries(formulaDefaults).forEach(([fieldName, value]) => {
          form.setValue(fieldName, value);
        });
      }
      
      // Mark that formulas have been initialized
      hasInitializedFormulas.current = true;
    }
  }, [enabledActionFields, objectFields, form, defaultValues, lookupFieldsValues]);
  
  // Immediately load lookup data when form initializes with lookup values
  useEffect(() => {
    const loadLookupData = async () => {
      // Check for lookup fields that have values
      const lookupFieldsWithValues = getLookupFieldsWithValues();
      
      if (lookupFieldsWithValues.size === 0) {
        return;
      }
      
      setIsLoadingLookupData(true);
      console.log(`Loading data for ${lookupFieldsWithValues.size} lookup fields:`, 
        Array.from(lookupFieldsWithValues.entries()));
      
      const newLookupValues: Record<string, Record<string, any>> = { ...lookupFieldsValues };
      let dataLoaded = false;
      
      // Process each lookup field
      for (const [fieldApiName, recordId] of lookupFieldsWithValues.entries()) {
        const fieldData = await fetchLookupFieldData(fieldApiName, recordId);
        
        if (fieldData) {
          newLookupValues[fieldApiName] = fieldData;
          lookupFieldsLoadedRef.current.add(fieldApiName);
          dataLoaded = true;
        }
      }
      
      if (dataLoaded) {
        console.log("Setting new lookup values:", newLookupValues);
        setLookupFieldsValues(newLookupValues);
      }
      
      setIsLoadingLookupData(false);
    };
    
    loadLookupData();
  }, [form.getValues]);
  
  // Re-evaluate formulas when lookup field values change
  useEffect(() => {
    // Only run this after initial formula evaluation and when lookup data changes
    if (hasInitializedFormulas.current && 
        Object.keys(lookupFieldsValues).length > 0 && 
        !hasProcessedLookupFormulas.current) {
      console.log("Re-evaluating formulas with lookup field data");
      
      const formulaUpdates: Record<string, any> = {};
      let hasUpdates = false;
      
      // Process action fields that have formulas
      enabledActionFields.forEach(actionField => {
        if (actionField.formula_type === 'dynamic' && actionField.formula_expression) {
          const field = objectFields.find(f => f.id === actionField.field_id);
          if (!field) return;
          
          // Check if the formula contains lookup references (e.g., {field.property})
          const hasLookupReference = /{\w+\.\w+}/.test(actionField.formula_expression);
          if (!hasLookupReference) return;
          
          console.log(`Re-evaluating lookup formula for ${field.api_name}:`, actionField.formula_expression);
          
          // Get the current form values and re-evaluate the formula
          const currentFormValues = form.getValues();
          const newValue = evaluateFormula(
            actionField.formula_expression,
            { 
              fieldValues: currentFormValues, 
              lookupFieldsValues 
            }
          );
          
          console.log(`Formula result for ${field.api_name}:`, newValue);
          
          // Only update if the value actually changed
          if (newValue !== currentFormValues[field.api_name]) {
            formulaUpdates[field.api_name] = newValue;
            hasUpdates = true;
          }
        }
      });
      
      // Apply all formula updates at once
      if (hasUpdates) {
        console.log("Updating form values with lookup-based formulas:", formulaUpdates);
        Object.entries(formulaUpdates).forEach(([fieldName, value]) => {
          form.setValue(fieldName, value);
        });
      }
      
      hasProcessedLookupFormulas.current = true;
    }
  }, [lookupFieldsValues, enabledActionFields, objectFields, form]);
  
  // Watch for lookup field value changes to load related data
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type !== 'change' || !name) return;
      
      // Check if this is a lookup field
      const field = enabledObjectFields.find(f => f.api_name === name && f.data_type === 'lookup');
      if (!field) return;
      
      const fieldValue = value[name];
      if (!fieldValue) return;
      
      // Check if we already loaded this value
      if (lookupFieldsLoadedRef.current.has(name) && lookupFieldsValues[name]) return;
      
      console.log(`Lookup field ${name} changed to ${fieldValue}, loading related data`);
      
      // Load the lookup field data
      (async () => {
        setIsLoadingLookupData(true);
        const fieldData = await fetchLookupFieldData(name, fieldValue);
        
        if (fieldData) {
          console.log(`Setting lookup data for ${name}:`, fieldData);
          setLookupFieldsValues(prev => ({
            ...prev,
            [name]: fieldData
          }));
          
          lookupFieldsLoadedRef.current.add(name);
          
          // Reset the processed flag so formulas will be re-evaluated
          hasProcessedLookupFormulas.current = false;
        }
        
        setIsLoadingLookupData(false);
      })();
    });
    
    return () => subscription.unsubscribe();
  }, [form, enabledObjectFields, lookupFieldsValues]);

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
        
        {isLoadingLookupData && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <AlertDescription>Loading lookup field data...</AlertDescription>
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
