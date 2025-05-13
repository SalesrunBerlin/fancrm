import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ColumnMapping } from "@/types"; // Import from types instead of defining locally

interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: any[];
}

export function useImportRecords(objectTypeId: string) {
  const [isImporting, setIsImporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const importData = async (
    csvData: any[],
    columnMappings: ColumnMapping[],
    skipFirstRow: boolean
  ): Promise<ImportResult> => {
    setIsImporting(true);
    setImportResult(null);

    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Skip the first row if the user has specified to do so
    const dataToImport = skipFirstRow ? csvData.slice(1) : csvData;

    for (const row of dataToImport) {
      try {
        // Transform the row data based on column mappings
        const fieldValues: { [key: string]: any } = {};
        for (const mapping of columnMappings) {
          const { sourceColumn, targetField } = mapping;
          fieldValues[targetField] = row[sourceColumn] || null; // Use null for empty values
        }

        // Create the record
        const { data: record, error: recordError } = await supabase
          .from("object_records")
          .insert({
            object_type_id: objectTypeId,
            owner_id: user?.id,
          })
          .select()
          .single();

        if (recordError) throw recordError;

        // Create the field values
        const fieldValuesToInsert = Object.entries(fieldValues).map(
          ([field_api_name, value]) => ({
            record_id: record.id,
            field_api_name,
            value: value === undefined ? null : String(value), // Store all values as strings
          })
        );

        const { error: valuesError } = await supabase
          .from("object_field_values")
          .insert(fieldValuesToInsert);

        if (valuesError) throw valuesError;

        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push({ row, error: error.message });
        console.error("Error importing row:", row, error);
      }
    }

    setIsImporting(false);
    return { successCount, errorCount, errors };
  };

  const handleImport = async (
    csvData: any[],
    columnMappings: ColumnMapping[],
    skipFirstRow: boolean
  ) => {
    try {
      const result = await importData(csvData, columnMappings, skipFirstRow);
      setImportResult(result);

      if (result.errorCount === 0) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.successCount} records.`,
        });
      } else {
        toast({
          title: "Import completed with errors",
          description: `Imported ${result.successCount} records with ${result.errorCount} errors.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "An error occurred during import.",
      });
    }
  };

  return {
    isImporting,
    importData: handleImport,
    importResult,
  };
}
