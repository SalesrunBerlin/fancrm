import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RelatedObjectType {
  id: string;
  name: string;
}

interface RelatedRelationship {
  id: string;
  name: string;
  relationship_type: string;
}

export interface RelatedRecord {
  id: string;
  created_at: string;
  updated_at: string;
  field_values?: Record<string, any>;
}

export interface RelatedSection {
  objectType: RelatedObjectType;
  relationship: RelatedRelationship;
  records: RelatedRecord[];
  fields: any[];
  displayField: any;
}

export function useRelatedRecords(objectTypeId: string, recordId: string) {
  return useQuery({
    queryKey: ["related-records", objectTypeId, recordId],
    queryFn: async (): Promise<RelatedSection[]> => {
      console.log(`Fetching related records for objectTypeId: ${objectTypeId}, recordId: ${recordId}`);
      
      // Get all relationships where this object type is involved
      const { data: relationships, error: relError } = await supabase
        .from("object_relationships")
        .select(`
          id,
          name,
          relationship_type,
          from_object_id,
          to_object_id
        `)
        .or(`from_object_id.eq.${objectTypeId},to_object_id.eq.${objectTypeId}`);

      if (relError) throw relError;
      if (!relationships) return [];

      console.log("Found relationships:", relationships);
      
      // Create a map to track processed relationship + object type combinations to prevent duplicates
      const processedRelationships = new Map();
      
      const sectionsPromises = relationships.map(async (relationship) => {
        // Determine if this is a forward or reverse relationship
        const isForward = relationship.from_object_id === objectTypeId;
        const relatedObjectTypeId = isForward ? relationship.to_object_id : relationship.from_object_id;
        
        // Create a unique key based on the relationship name + object type ID instead of relationship ID
        // This will prevent duplicate sections with the same relationship name pointing to the same object type
        const relationshipKey = `${relationship.name}-${relatedObjectTypeId}`;
        
        // Skip if we've already processed this combination
        if (processedRelationships.has(relationshipKey)) {
          console.log(`Skipping duplicate relationship: ${relationshipKey}`);
          return null;
        }
        
        // Mark this combination as processed
        processedRelationships.set(relationshipKey, true);
        
        console.log(`Processing relationship: ${relationship.name}, isForward: ${isForward}`);
        console.log(`Related object type ID: ${relatedObjectTypeId}`);
        
        // Get the object type info early so we can use it for logging and later
        const { data: objectType } = await supabase
          .from("object_types")
          .select("*")
          .eq("id", relatedObjectTypeId)
          .single();
          
        if (!objectType) {
          console.log(`No object type found for ID: ${relatedObjectTypeId}`);
          return null;
        }
          
        console.log(`Related object type: ${objectType.name}`);
        
        // Get the stored field settings for this object type
        const storedFieldsString = localStorage.getItem(`visible-fields-${relatedObjectTypeId}`);
        let visibleFieldsApiNames: string[] = [];
        
        try {
          if (storedFieldsString) {
            visibleFieldsApiNames = JSON.parse(storedFieldsString);
          }
        } catch (e) {
          console.error("Error parsing stored fields:", e);
        }
        
        // Get the fields for the related object type
        const { data: fields } = await supabase
          .from("object_fields")
          .select("*")
          .eq("object_type_id", relatedObjectTypeId)
          .order("display_order");

        if (!fields || fields.length === 0) {
          console.log(`No fields found for object type: ${objectType.name}`);
          return null;
        }

        console.log(`Found ${fields.length} fields for object type ${objectType.name}`);

        // If we don't have visible fields stored, default to the first 5 fields
        if (visibleFieldsApiNames.length === 0 && fields.length > 0) {
          visibleFieldsApiNames = fields.slice(0, 5).map(f => f.api_name);
        }

        // Get records that reference this record
        let records = [];

        if (isForward) {
          // For forward relationships, find a lookup field in the target object that points back
          const lookupField = fields.find(f => {
            if (f.data_type === "lookup" && f.options) {
              // Safely access target_object_type_id
              const options = typeof f.options === 'object' ? f.options as { target_object_type_id?: string } : null;
              return options?.target_object_type_id === objectTypeId;
            }
            return false;
          });

          console.log(`Lookup field found for ${objectType.name}:`, lookupField);
          
          if (lookupField) {
            // Find records where the lookup field points to our current record
            const { data: fieldValues } = await supabase
              .from("object_field_values")
              .select("record_id")
              .eq("field_api_name", lookupField.api_name)
              .eq("value", recordId);

            if (fieldValues && fieldValues.length > 0) {
              const recordIds = fieldValues.map(fv => fv.record_id);
              console.log(`Found ${recordIds.length} forward relationship record IDs for ${objectType.name}`);

              const { data: relatedRecords } = await supabase
                .from("object_records")
                .select("*")
                .in("id", recordIds);

              records = relatedRecords || [];
              console.log(`Found ${records.length} forward related records for ${objectType.name}`);
            } else {
              console.log(`No field values found for forward relationship to ${objectType.name}`);
            }
          }
        } else {
          // For reverse relationships, find records that our record references via a lookup field
          const lookupFields = fields.filter(f => {
            if (f.data_type === "lookup" && f.options) {
              // Type guard to check if options has target_object_type_id
              const options = typeof f.options === 'object' ? f.options as { target_object_type_id?: string } : null;
              return options?.target_object_type_id === objectTypeId;
            }
            return false;
          });
          
          if (lookupFields.length > 0) {
            console.log(`Found ${lookupFields.length} reverse lookup fields in ${objectType.name}`);
            
            // Find all records from the target object type
            const { data: allTargetRecords } = await supabase
              .from("object_records")
              .select("*")
              .eq("object_type_id", relatedObjectTypeId);
              
            if (allTargetRecords && allTargetRecords.length > 0) {
              console.log(`Found ${allTargetRecords.length} potential related records for ${objectType.name}`);
              
              // Get all field values for these records
              const { data: allFieldValues } = await supabase
                .from("object_field_values")
                .select("*")
                .in("record_id", allTargetRecords.map(r => r.id));
                
              if (allFieldValues) {
                // Filter records that have a lookup field referencing our current record
                const relatedRecordIds = allFieldValues
                  .filter(fv => {
                    const matchingField = lookupFields.find(f => f.api_name === fv.field_api_name);
                    return matchingField && fv.value === recordId;
                  })
                  .map(fv => fv.record_id);
                  
                console.log(`Found ${relatedRecordIds.length} related record IDs for ${objectType.name}`);
                
                if (relatedRecordIds.length > 0) {
                  records = allTargetRecords.filter(r => relatedRecordIds.includes(r.id));
                  console.log(`Found ${records.length} filtered related records for ${objectType.name}`);
                }
              }
            }
          } else {
            console.log(`No lookup fields found in ${objectType.name} that reference this object type`);
          }
        }

        if (!records || records.length === 0) {
          console.log(`No related records found for ${objectType.name}`);
          return null;
        }

        // Get values for these records
        const { data: values } = await supabase
          .from("object_field_values")
          .select("*")
          .in("record_id", records.map(r => r.id));

        const recordsWithValues = records.map(record => ({
          ...record,
          field_values: values
            ?.filter(v => v.record_id === record.id)
            .reduce((acc, v) => ({
              ...acc,
              [v.field_api_name]: v.value
            }), {})
        }));

        // Filter fields based on visible fields settings
        const visibleFields = fields.filter(f => visibleFieldsApiNames.includes(f.api_name));

        return {
          objectType,
          relationship,
          records: recordsWithValues,
          fields: visibleFields,
          displayField: fields.find(f => f.api_name === objectType.default_field_api_name) || fields[0]
        };
      });

      const sections = await Promise.all(sectionsPromises);
      return sections.filter(Boolean) as RelatedSection[];
    }
  });
}
