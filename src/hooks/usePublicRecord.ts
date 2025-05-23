import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ObjectField, ObjectRecord } from "@/types/ObjectFieldTypes";

export interface PublicRecordAccess {
  record?: ObjectRecord;
  fields?: ObjectField[];
  visibleFieldNames?: string[];
  relatedObjectTypes?: {
    id: string;
    name: string;
    relationship_id: string;
  }[];
  isLoading: boolean;
  error: any;
  allowEdit: boolean;
}

export function usePublicRecord(token?: string, recordId?: string): PublicRecordAccess {
  // Get the public record and its allowed fields
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-record", token, recordId],
    queryFn: async (): Promise<PublicRecordAccess> => {
      if (!token || !recordId) {
        return { isLoading: false, error: null, allowEdit: false };
      }

      try {
        // First, check if this record is publicly accessible with this token
        const { data: shareData, error: shareError } = await supabase
          .from("public_record_shares")
          .select("*, object_types(name)")
          .eq("token", token)
          .eq("record_id", recordId)
          .eq("is_active", true)
          .single();

        if (shareError) throw shareError;
        if (!shareData) throw new Error("Record not found or access denied");

        // Get visible fields for this share
        const { data: visibleFieldsData, error: fieldsError } = await supabase
          .rpc("get_public_visible_fields", {
            p_token: token,
            p_record_id: recordId,
          });

        if (fieldsError) throw fieldsError;
        const visibleFieldNames = visibleFieldsData.map((f: { field_api_name: string }) => f.field_api_name);

        // Get the object fields
        const { data: objectFields, error: objectFieldsError } = await supabase
          .from("object_fields")
          .select("*")
          .eq("object_type_id", shareData.object_type_id);

        if (objectFieldsError) throw objectFieldsError;

        // Create properly typed fields array
        const fields: ObjectField[] = objectFields
          .filter((field: any) => visibleFieldNames.includes(field.api_name))
          .map((field: any) => ({
            ...field,
            default_value: field.default_value !== null 
              ? typeof field.default_value === 'object' 
                ? JSON.stringify(field.default_value) 
                : String(field.default_value) 
              : null,
            options: field.options
          }));

        // Get the record data
        const { data: recordData, error: recordError } = await supabase
          .from("object_records")
          .select("*")
          .eq("id", recordId)
          .single();

        if (recordError) throw recordError;

        // Get field values for this record
        const { data: fieldValues, error: fieldValuesError } = await supabase
          .from("object_field_values")
          .select("field_api_name, value")
          .eq("record_id", recordId);

        if (fieldValuesError) throw fieldValuesError;

        // Convert field values to an object
        const valuesObject = fieldValues.reduce((acc: any, curr: any) => {
          if (visibleFieldNames.includes(curr.field_api_name)) {
            acc[curr.field_api_name] = curr.value;
          }
          return acc;
        }, {});

        // Get visible related objects
        const { data: relatedObjectsData, error: relatedObjectsError } = await supabase
          .rpc("get_public_visible_related_objects", {
            p_token: token,
            p_record_id: recordId,
          });

        if (relatedObjectsError) throw relatedObjectsError;

        // Get object type info for related objects
        const relatedObjectTypes = [];
        if (relatedObjectsData && relatedObjectsData.length > 0) {
          const objectTypeIds = relatedObjectsData.map((o: { related_object_type_id: string }) => o.related_object_type_id);
          
          const { data: objectTypesData, error: objectTypesError } = await supabase
            .from("object_types")
            .select("id, name")
            .in("id", objectTypeIds);
            
          if (objectTypesError) throw objectTypesError;
          
          for (const relObj of relatedObjectsData) {
            const objectType = objectTypesData.find(
              (ot: any) => ot.id === relObj.related_object_type_id
            );
            if (objectType) {
              relatedObjectTypes.push({
                id: objectType.id,
                name: objectType.name,
                relationship_id: relObj.relationship_id,
              });
            }
          }
        }

        // Find default field for display name
        const { data: objectType } = await supabase
          .from("object_types")
          .select("default_field_api_name, name")
          .eq("id", shareData.object_type_id)
          .single();

        let displayName = null;
        if (objectType?.default_field_api_name) {
          displayName = valuesObject[objectType.default_field_api_name] || null;
        }

        // Create properly typed ObjectRecord
        const typedRecord: ObjectRecord = {
          ...recordData,
          field_values: valuesObject,
          displayName,
          objectName: objectType?.name || 'Object'
        };

        return {
          record: typedRecord,
          fields,
          visibleFieldNames,
          relatedObjectTypes,
          isLoading: false,
          error: null,
          allowEdit: shareData.allow_edit,
        };
      } catch (error) {
        console.error("Error fetching public record:", error);
        throw error;
      }
    },
    enabled: !!token && !!recordId,
  });

  return {
    record: data?.record,
    fields: data?.fields || [],
    visibleFieldNames: data?.visibleFieldNames || [],
    relatedObjectTypes: data?.relatedObjectTypes || [],
    isLoading,
    error,
    allowEdit: data?.allowEdit || false,
  };
}

// Hook to get related records for a public record with improved performance
export function usePublicRelatedRecords(
  token?: string,
  recordId?: string,
  relatedObjectTypeId?: string,
  relationshipId?: string
) {
  return useQuery({
    queryKey: ["public-related-records", token, recordId, relatedObjectTypeId, relationshipId],
    queryFn: async () => {
      if (!token || !recordId || !relatedObjectTypeId || !relationshipId) {
        return [];
      }

      try {
        // First check if this relationship is allowed for this token
        const { data: allowedRelationships, error: relationshipsError } = await supabase
          .rpc("get_public_visible_related_objects", {
            p_token: token,
            p_record_id: recordId,
          });

        if (relationshipsError) throw relationshipsError;

        const isAllowed = allowedRelationships.some(
          (r: any) => 
            r.related_object_type_id === relatedObjectTypeId && 
            r.relationship_id === relationshipId
        );

        if (!isAllowed) {
          throw new Error("Access to related records denied");
        }

        // Get the relationship details
        const { data: relationship, error: relationshipError } = await supabase
          .from("object_relationships")
          .select("*")
          .eq("id", relationshipId)
          .single();

        if (relationshipError) throw relationshipError;

        try {
          // Try to use the optimized RPC function if available
          const { data: records, error: recordsError } = await supabase
            .rpc("get_public_related_records", {
              p_record_id: recordId,
              p_related_object_type_id: relatedObjectTypeId,
              p_relationship_id: relationshipId
            });

          if (recordsError) {
            throw recordsError;
          }

          // Format the records from the RPC 
          return (Array.isArray(records) ? records : []).map((record: any) => ({
            ...record,
            field_values: record.field_values || {}
          })) as ObjectRecord[];
          
        } catch (rpcError) {
          console.error("Error using RPC function, falling back to standard queries:", rpcError);
          
          // Fallback to the old approach if the RPC isn't available
          const { data: relatedRecords, error: fallbackError } = await supabase
            .from("object_records")
            .select(`
              id, 
              record_id, 
              object_type_id, 
              created_at, 
              updated_at
            `)
            .eq("object_type_id", relatedObjectTypeId);

          if (fallbackError) throw fallbackError;

          // For each related record, get its field values
          const recordsWithValues = await Promise.all(
            relatedRecords.map(async (record: any) => {
              const { data: fieldValues, error: fieldValuesError } = await supabase
                .from("object_field_values")
                .select("field_api_name, value")
                .eq("record_id", record.id);

              if (fieldValuesError) throw fieldValuesError;

              const valuesObject = fieldValues.reduce((acc: any, curr: any) => {
                acc[curr.field_api_name] = curr.value;
                return acc;
              }, {});

              return {
                ...record,
                field_values: valuesObject,
              };
            })
          );

          return recordsWithValues as ObjectRecord[];
        }
      } catch (error) {
        console.error("Error fetching related records:", error);
        throw error;
      }
    },
    enabled: !!token && !!recordId && !!relatedObjectTypeId && !!relationshipId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
