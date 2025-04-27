
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RecordFormData } from "@/lib/types/records";

export interface ObjectRecord {
  id: string;
  record_id: string;
  object_type_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  last_modified_by: string;
  owner_id: string;
  field_values?: { [key: string]: string | null };
}

export function useObjectRecords(objectTypeId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: ["object-records", objectTypeId],
    queryFn: async (): Promise<ObjectRecord[]> => {
      // First get the records
      const { data: recordsData, error: recordsError } = await supabase
        .from("object_records")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .order("created_at", { ascending: false });

      if (recordsError) throw recordsError;

      // Then get their field values
      const recordsWithValues = await Promise.all(
        recordsData.map(async (record) => {
          const { data: fieldValues, error: fieldValuesError } = await supabase
            .from("object_field_values")
            .select("field_api_name, value")
            .eq("record_id", record.id);

          if (fieldValuesError) throw fieldValuesError;

          // Convert field values array to object
          const valuesObject = fieldValues.reduce((acc, curr) => {
            acc[curr.field_api_name] = curr.value;
            return acc;
          }, {} as { [key: string]: string | null });

          return {
            ...record,
            field_values: valuesObject
          };
        })
      );

      return recordsWithValues;
    },
    enabled: !!user && !!objectTypeId,
  });

  const createRecord = useMutation({
    mutationFn: async (formData: RecordFormData) => {
      if (!objectTypeId) throw new Error("Object type ID is required");
      
      // Step 1: Create the record in object_records table
      const { data: recordData, error: recordError } = await supabase
        .from("object_records")
        .insert({
          object_type_id: objectTypeId,
          owner_id: user?.id
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Step 2: Create field values in the object_field_values table
      const fieldValues = Object.entries(formData).map(([fieldName, value]) => ({
        record_id: recordData.id,
        field_api_name: fieldName,
        value: value !== null && value !== undefined ? String(value) : null
      }));

      if (fieldValues.length > 0) {
        const { error: fieldValuesError } = await supabase
          .from("object_field_values")
          .insert(fieldValues);

        if (fieldValuesError) throw fieldValuesError;
      }

      return recordData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast({
        title: "Success",
        description: "Record created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating record:", error);
      toast({
        title: "Error",
        description: "Failed to create record",
        variant: "destructive",
      });
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, field_values }: { id: string, field_values: Record<string, any> }) => {
      // Update the object_field_values for each changed field
      const updates = Object.entries(field_values).map(async ([fieldApiName, value]) => {
        // Check if the field value exists
        const { data: existingValue } = await supabase
          .from("object_field_values")
          .select("*")
          .eq("record_id", id)
          .eq("field_api_name", fieldApiName)
          .single();

        const stringValue = value !== null && value !== undefined ? String(value) : null;

        if (existingValue) {
          // Update existing field value
          const { error } = await supabase
            .from("object_field_values")
            .update({ value: stringValue })
            .eq("record_id", id)
            .eq("field_api_name", fieldApiName);

          if (error) throw error;
        } else {
          // Insert new field value
          const { error } = await supabase
            .from("object_field_values")
            .insert({
              record_id: id,
              field_api_name: fieldApiName,
              value: stringValue
            });

          if (error) throw error;
        }
      });

      // Wait for all updates to complete
      await Promise.all(updates);

      // Update the last_modified timestamp on the record
      const { error: recordUpdateError } = await supabase
        .from("object_records")
        .update({ 
          updated_at: new Date().toISOString(),
          last_modified_by: user?.id
        })
        .eq("id", id);

      if (recordUpdateError) throw recordUpdateError;

      return { id, field_values };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast({
        title: "Success",
        description: "Record updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating record:", error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    },
  });

  const getRecord = async (recordId: string): Promise<ObjectRecord | null> => {
    // Get the record
    const { data: record, error: recordError } = await supabase
      .from("object_records")
      .select("*")
      .eq("id", recordId)
      .single();

    if (recordError) {
      console.error("Error fetching record:", recordError);
      return null;
    }

    // Get field values
    const { data: fieldValues, error: fieldValuesError } = await supabase
      .from("object_field_values")
      .select("field_api_name, value")
      .eq("record_id", recordId);

    if (fieldValuesError) {
      console.error("Error fetching field values:", fieldValuesError);
      return null;
    }

    // Convert field values array to object
    const valuesObject = fieldValues.reduce((acc, curr) => {
      acc[curr.field_api_name] = curr.value;
      return acc;
    }, {} as { [key: string]: string | null });

    return {
      ...record,
      field_values: valuesObject
    };
  };

  return {
    records,
    isLoading,
    createRecord,
    updateRecord,
    getRecord
  };
}
