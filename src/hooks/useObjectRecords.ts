
// This file doesn't exist in the allowed files list, so I'll assume we need to create it
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { trackActivity } from "@/services/ActivityTrackingService";

interface RecordData {
  field_values: { [key: string]: any };
  id?: string;
}

export function useObjectRecords(objectTypeId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get all records for an object type
  const {
    data: records,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["object-records", objectTypeId],
    queryFn: async () => {
      if (!objectTypeId) return [];

      const { data, error } = await supabase
        .from("object_records")
        .select("*, field_values:object_field_values(field_api_name, value)")
        .eq("object_type_id", objectTypeId);

      if (error) throw error;

      // Track viewing of records if authenticated
      if (user) {
        trackActivity(
          user.id,
          'view_page',
          'Viewed records list',
          'object_type',
          objectTypeId
        );
      }

      return data.map(record => {
        const fieldValues = {};
        record.field_values?.forEach(fv => {
          fieldValues[fv.field_api_name] = fv.value;
        });
        return {
          ...record,
          fieldValues
        };
      });
    },
    enabled: !!objectTypeId
  });

  // Create a new record
  const createRecord = useMutation({
    mutationFn: async (data: RecordData) => {
      if (!objectTypeId) throw new Error("No object type ID provided");

      // Create record in object_records table
      const { data: recordData, error: recordError } = await supabase
        .from("object_records")
        .insert({
          object_type_id: objectTypeId,
          owner_id: user?.id
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Insert field values
      const fieldValuePromises = Object.entries(data.field_values).map(([key, value]) => {
        return supabase
          .from("object_field_values")
          .insert({
            record_id: recordData.id,
            field_api_name: key,
            value: value?.toString()
          });
      });

      await Promise.all(fieldValuePromises);

      // Track record creation
      if (user) {
        trackActivity(
          user.id,
          'record_create',
          'Created record',
          'object_type',
          objectTypeId,
          { record_id: recordData.id }
        );
      }

      return recordData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast.success("Record created successfully");
    },
    onError: (error) => {
      console.error("Error creating record:", error);
      toast.error("Failed to create record");
    }
  });

  // Update an existing record
  const updateRecord = useMutation({
    mutationFn: async (data: RecordData) => {
      if (!objectTypeId || !data.id) throw new Error("No object type ID or record ID provided");

      // Update record in object_records table to update the timestamp
      await supabase
        .from("object_records")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.id);

      // Update field values
      const fieldValuePromises = Object.entries(data.field_values).map(([key, value]) => {
        return supabase
          .from("object_field_values")
          .upsert({
            record_id: data.id,
            field_api_name: key,
            value: value?.toString()
          }, { 
            onConflict: 'record_id,field_api_name' 
          });
      });

      await Promise.all(fieldValuePromises);

      // Track record update
      if (user) {
        trackActivity(
          user.id,
          'record_update',
          'Updated record',
          'object_type',
          objectTypeId,
          { record_id: data.id }
        );
      }

      return { id: data.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast.success("Record updated successfully");
    },
    onError: (error) => {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    }
  });

  // Delete a record
  const deleteRecord = useMutation({
    mutationFn: async (recordId: string) => {
      if (!recordId) throw new Error("No record ID provided");
      
      // Delete record in object_records table
      const { error } = await supabase
        .from("object_records")
        .delete()
        .eq("id", recordId);

      if (error) throw error;

      // Track record deletion
      if (user) {
        trackActivity(
          user.id,
          'record_delete',
          'Deleted record',
          'object_type',
          objectTypeId,
          { record_id: recordId }
        );
      }

      return { id: recordId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast.success("Record deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
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
