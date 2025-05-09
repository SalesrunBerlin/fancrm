
import { useState, useEffect } from "react";
import { useRecordFields } from "@/hooks/useRecordFields";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { ObjectField } from "@/hooks/useObjectTypes";

export function useEnhancedFields(objectTypeId: string) {
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const [enhancedFields, setEnhancedFields] = useState<ObjectField[]>([]);
  const [picklistFieldsToProcess, setPicklistFieldsToProcess] = useState<string[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(true);

  // First identify picklist fields that need enhancement
  useEffect(() => {
    if (!isLoadingFields && fields) {
      const picklistFields = fields
        .filter(field => field.data_type === 'picklist')
        .map(field => field.id);
      
      setPicklistFieldsToProcess(picklistFields);
      
      // If no picklist fields, we can skip enhancement
      if (picklistFields.length === 0) {
        setEnhancedFields([...fields]);
        setIsEnhancing(false);
      }
    }
  }, [fields, isLoadingFields]);

  // Process each picklist field one by one
  const currentFieldId = picklistFieldsToProcess[0];
  const { picklistValues, isLoading: isLoadingPicklistValues } = useFieldPicklistValues(currentFieldId || "");

  // Process the next picklist field or finish enhancing
  useEffect(() => {
    if (picklistFieldsToProcess.length > 0 && currentFieldId && !isLoadingPicklistValues) {
      const updatedFields = [...(enhancedFields.length ? enhancedFields : fields)];
      const fieldIndex = updatedFields.findIndex(field => field.id === currentFieldId);
      
      if (fieldIndex !== -1 && picklistValues) {
        // Create a well-formed options object with values for the picklist
        const options = {
          values: picklistValues.map(pv => ({ 
            value: pv.value, 
            label: pv.label 
          }))
        };

        // Update the field with the picklist values
        updatedFields[fieldIndex] = {
          ...updatedFields[fieldIndex],
          options: options
        };
        
        setEnhancedFields(updatedFields);
        
        // Remove this field from the processing queue
        setPicklistFieldsToProcess(prev => prev.slice(1));
      } else {
        // Skip this field if it no longer exists in our fields array
        setPicklistFieldsToProcess(prev => prev.slice(1));
      }
    } else if (picklistFieldsToProcess.length === 0 && enhancedFields.length) {
      // All picklist fields have been processed
      setIsEnhancing(false);
    }
  }, [picklistValues, isLoadingPicklistValues, currentFieldId, picklistFieldsToProcess, fields, enhancedFields]);

  return {
    fields: enhancedFields.length > 0 ? enhancedFields : fields,
    isLoading: isLoadingFields || isEnhancing
  };
}
