import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { type DuplicateRecord } from "@/types";

interface ImportResult {
  success: boolean;
  message?: string;
  error?: any;
  duplicates?: DuplicateRecord[];
}

export function useImportRecords(objectTypeId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createObjectType } = useObjectTypes();
  const { createRecord, updateRecord } = useObjectRecords(objectTypeId);
  const [isImporting, setIsImporting] = useState(false);

  const importData = async (
    data: Record<string, any>[],
    columnMap: Record<string, string>,
    handleDuplicates: "skip" | "update" | "review" = "skip"
  ): Promise<ImportResult> => {
    setIsImporting(true);
    try {
      const objectType = await supabase
        .from("object_types")
        .select("*")
        .eq("id", objectTypeId)
        .single();

      if (!objectType) {
        return { success: false, message: "Object type not found" };
      }

      const fields = await supabase
        .from("object_fields")
        .select("*")
        .eq("object_type_id", objectTypeId);

      if (!fields) {
        return { success: false, message: "No fields found for this object type" };
      }

      const apiNameToFieldIdMap: Record<string, string> = fields.reduce((acc: Record<string, string>, field: any) => {
        acc[field.api_name] = field.id;
        return acc;
      }, {});

      const recordsToCreate = [];
      const duplicateRecords: DuplicateRecord[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const recordData: Record<string, any> = {};

        // Map columns to field API names
        for (const columnName in columnMap) {
          const fieldApiName = columnMap[columnName];
          if (fieldApiName) {
            recordData[fieldApiName] = row[columnName];
          }
        }

        // Check for existing records based on mapped data
        const existingRecords = await findExistingRecords(objectTypeId, recordData);

        if (existingRecords.length > 0) {
          if (handleDuplicates === "skip") {
            console.log(`Skipping duplicate record at row ${i + 1}`);
            continue;
          } else if (handleDuplicates === "update") {
            // For simplicity, update the first matching record
            const existingRecord = existingRecords[0];
            duplicateRecords.push({
              importRowIndex: i + 1,
              existingRecord: existingRecord,
              matchingFields: Object.keys(recordData), // Adjust as needed
              action: 'update',
              record: recordData
            });
          } else if (handleDuplicates === "review") {
            duplicateRecords.push({
              importRowIndex: i + 1,
              existingRecord: existingRecords[0],
              matchingFields: Object.keys(recordData), // Adjust as needed
              action: 'create', // Default to create, can be changed in review
              record: recordData
            });
          }
        } else {
          // No duplicates found, proceed to create the record
          recordsToCreate.push(recordData);
        }
      }

      // Handle duplicate records based on the selected strategy
      if (duplicateRecords.length > 0 && handleDuplicates === "review") {
        setIsImporting(false);
        return {
          success: false,
          message: "Duplicate records found. Please review.",
          duplicates: duplicateRecords,
        };
      } else if (duplicateRecords.length > 0 && (handleDuplicates === "update" || handleDuplicates === "skip")) {
        const processed = await processDuplicateRecords(duplicateRecords);
        if (!processed) {
          return { success: false, message: "Failed to process duplicate records" };
        }
      }

      // Create records in batches
      if (recordsToCreate.length > 0) {
        for (const recordData of recordsToCreate) {
          await createRecord.mutateAsync({ data: recordData });
        }
      }

      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });

      toast({
        title: "Success",
        description: `Successfully imported ${recordsToCreate.length} records`,
      });

      return { success: true, message: `Successfully imported ${recordsToCreate.length} records` };
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast({
        title: "Error",
        description: "Failed to import data",
        variant: "destructive",
      });
      return { success: false, message: "Failed to import data", error: error };
    } finally {
      setIsImporting(false);
    }
  };

  const findExistingRecords = async (objectTypeId: string, recordData: Record<string, any>): Promise<any[]> => {
    try {
      // Build the filter based on the record data
      let query = supabase
        .from("object_records")
        .select("id")
        .eq("object_type_id", objectTypeId);

      for (const fieldApiName in recordData) {
        const value = recordData[fieldApiName];
        query = query.eq(`field_values->${fieldApiName}`, value);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error finding existing records:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in findExistingRecords:", error);
      return [];
    }
  };

  const processDuplicateRecords = async (duplicates: DuplicateRecord[]): Promise<boolean> => {
    try {
      // Creating array for records to update
      const recordsToUpdate = duplicates
        .filter(dup => dup.action === 'update')
        .map(dup => ({
          id: dup.existingRecord.id,
          field_values: dup.record // Use the import row data
        }));

      // Creating array for records to create
      const recordsToCreate = duplicates
        .filter(dup => dup.action === 'create')
        .map(dup => ({
          data: dup.record
        }));

      // Perform updates if needed
      if (recordsToUpdate.length > 0) {
        for (const record of recordsToUpdate) {
          await updateRecord.mutateAsync(record);
        }
      }

      // Perform creates if needed
      if (recordsToCreate.length > 0) {
        for (const record of recordsToCreate) {
          await createRecord.mutateAsync(record);
        }
      }

      // All duplicates handled successfully
      return true;
    } catch (error) {
      console.error("Error processing duplicate records:", error);
      toast({
        title: "Error",
        description: "Failed to process duplicate records",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    importData,
    isImporting,
  };
}
