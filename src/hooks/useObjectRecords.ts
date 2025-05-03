
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RecordFormData } from "@/types";

export interface ObjectRecord {
  id: string;
  record_id: string | null;
  object_type_id: string;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  created_by: string | null;
  last_modified_by: string | null;
  field_values?: { [key: string]: any };
  displayName?: string;
}

export function useObjectRecords(objectTypeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: records,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["object-records", objectTypeId],
    queryFn: async (): Promise<ObjectRecord[]> => {
      if (!objectTypeId || !user) {
        return [];
      }
      
      console.log(`Fetching records for object type: ${objectTypeId}`);
      
      // First, check if this object is owned by current user or is a system object
      const { data: objectType, error: objectError } = await supabase
        .from("object_types")
        .select("owner_id, is_system")
        .eq("id", objectTypeId)
        .single();
      
      if (objectError) {
        console.error("Error fetching object type:", objectError);
        throw objectError;
      }
      
      let recordsQuery = supabase
        .from("object_records")
        .select("*")
        .eq("object_type_id", objectTypeId);
        
      // For non-system objects that current user doesn't own, only show records they own
      if (!objectType.is_system && objectType.owner_id !== user.id) {
        recordsQuery = recordsQuery.eq("owner_id", user.id);
      }
      
      // Limit to 100 records for performance
      const { data: recordsData, error: recordsError } = await recordsQuery.limit(100);
      
      if (recordsError) {
        console.error("Error fetching records:", recordsError);
        throw recordsError;
      }
      
      // Get field values for all records
      const recordIds = recordsData.map(record => record.id);
      
      if (recordIds.length === 0) {
        return [];
      }
      
      const { data: fieldValuesData, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("*")
        .in("record_id", recordIds);
      
      if (fieldValuesError) {
        console.error("Error fetching field values:", fieldValuesError);
        throw fieldValuesError;
      }

      // Group field values by record id
      const fieldValuesByRecordId = fieldValuesData.reduce((acc, fieldValue) => {
        if (!acc[fieldValue.record_id]) {
          acc[fieldValue.record_id] = {};
        }
        acc[fieldValue.record_id][fieldValue.field_api_name] = fieldValue.value;
        return acc;
      }, {} as { [key: string]: { [key: string]: any } });
      
      // Add field values to records
      const recordsWithFieldValues = recordsData.map(record => ({
        ...record,
        field_values: fieldValuesByRecordId[record.id] || {}
      }));
      
      console.log(`Fetched ${recordsWithFieldValues.length} records with field values`);
      return recordsWithFieldValues;
    },
    enabled: !!objectTypeId && !!user,
  });

  const createRecord = useMutation({
    mutationFn: async (formData: RecordFormData) => {
      if (!objectTypeId || !user) {
        throw new Error("Missing objectTypeId or user");
      }
      
      console.log("Creating record with data:", formData);

      // First, create the record with owner_id
      const { data: newRecord, error: recordError } = await supabase
        .from("object_records")
        .insert([{ 
          object_type_id: objectTypeId,
          owner_id: user.id, // Always set current user as owner
          created_by: user.id,
          last_modified_by: user.id
        }])
        .select()
        .single();

      if (recordError) {
        console.error("Error creating record:", recordError);
        throw recordError;
      }

      // Then, create the field values
      const fieldValues = Object.entries(formData).map(([key, value]) => ({
        record_id: newRecord.id,
        field_api_name: key,
        value: value === null ? null : String(value)
      }));

      if (fieldValues.length > 0) {
        const { error: fieldValuesError } = await supabase
          .from("object_field_values")
          .insert(fieldValues);

        if (fieldValuesError) {
          console.error("Error creating field values:", fieldValuesError);
          throw fieldValuesError;
        }
      }

      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, field_values }: { id: string, field_values: RecordFormData }) => {
      if (!id || !user) {
        throw new Error("Missing record id or user");
      }
      
      // Check if the user has permission to update this record
      const { data: recordData, error: recordCheckError } = await supabase
        .from("object_records")
        .select("owner_id, object_type_id")
        .eq("id", id)
        .single();
      
      if (recordCheckError) throw recordCheckError;
      
      // Check if user owns the record or the object type
      const { data: objectTypeData, error: objectTypeError } = await supabase
        .from("object_types")
        .select("owner_id, is_system")
        .eq("id", recordData.object_type_id)
        .single();
      
      if (objectTypeError) throw objectTypeError;
      
      // Only allow update if user owns the record, or owns the object type, or it's a system object
      const canUpdate = recordData.owner_id === user.id || 
                        objectTypeData.owner_id === user.id ||
                        objectTypeData.is_system;
      
      if (!canUpdate) {
        throw new Error("You don't have permission to update this record");
      }
      
      console.log("Updating record:", id, "with data:", field_values);

      // Update the record's timestamp and ensure last_modified_by is set
      const { error: recordError } = await supabase
        .from("object_records")
        .update({ 
          updated_at: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq("id", id);

      if (recordError) {
        console.error("Error updating record:", recordError);
        throw recordError;
      }

      // For each field value, upsert (update or insert)
      for (const [key, value] of Object.entries(field_values)) {
        const { error } = await supabase
          .from("object_field_values")
          .upsert({
            record_id: id,
            field_api_name: key,
            value: value === null ? null : String(value)
          }, {
            onConflict: 'record_id,field_api_name'
          });

        if (error) {
          console.error(`Error updating field ${key}:`, error);
          throw error;
        }
      }

      return { id, field_values };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      queryClient.invalidateQueries({ queryKey: ["record-detail", objectTypeId] });
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      if (!id || !user) {
        throw new Error("Missing record id or user");
      }
      
      // Check if the user has permission to delete this record
      const { data: recordData, error: recordCheckError } = await supabase
        .from("object_records")
        .select("owner_id, object_type_id")
        .eq("id", id)
        .single();
      
      if (recordCheckError) throw recordCheckError;
      
      // Check if user owns the record or the object type
      const { data: objectTypeData, error: objectTypeError } = await supabase
        .from("object_types")
        .select("owner_id, is_system")
        .eq("id", recordData.object_type_id)
        .single();
      
      if (objectTypeError) throw objectTypeError;
      
      // Only allow delete if user owns the record, or owns the object type, or it's a system object
      const canDelete = recordData.owner_id === user.id || 
                        objectTypeData.owner_id === user.id ||
                        objectTypeData.is_system;
      
      if (!canDelete) {
        throw new Error("You don't have permission to delete this record");
      }
      
      console.log("Deleting record:", id);

      // First delete all field values
      const { error: fieldValuesError } = await supabase
        .from("object_field_values")
        .delete()
        .eq("record_id", id);

      if (fieldValuesError) {
        console.error("Error deleting field values:", fieldValuesError);
        throw fieldValuesError;
      }

      // Then delete the record
      const { error: recordError } = await supabase
        .from("object_records")
        .delete()
        .eq("id", id);

      if (recordError) {
        console.error("Error deleting record:", recordError);
        throw recordError;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  return {
    records,
    isLoading,
    error,
    refetch,
    createRecord,
    updateRecord,
    deleteRecord
  };
}
