
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportData {
  headers: string[];
  rows: string[][];
}

interface ColumnMapping {
  sourceColumnIndex: number;
  sourceColumnName: string;
  targetField: ObjectField | null;
}

export function useImportRecords(objectTypeId: string, fields: ObjectField[]) {
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  // Parse pasted text into a structured format
  const parseImportText = useCallback((text: string) => {
    // Detect delimiter (tab or comma)
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return null;
    
    const firstLine = lines[0];
    // Check if it's likely tab-delimited
    const isTabDelimited = firstLine.includes('\t');
    const delimiter = isTabDelimited ? '\t' : ',';
    
    // Parse headers
    const headers = firstLine.split(delimiter).map(h => h.trim());
    
    // Parse data rows
    const rows = lines.slice(1).map(line => 
      line.split(delimiter).map(cell => cell.trim())
    );
    
    // Generate initial column mappings
    const mappings: ColumnMapping[] = headers.map((header, index) => {
      // Try to find a matching field
      const matchingField = fields.find(field => 
        field.name.toLowerCase() === header.toLowerCase() || 
        field.api_name.toLowerCase() === header.toLowerCase()
      );
      
      return {
        sourceColumnIndex: index,
        sourceColumnName: header,
        targetField: matchingField || null
      };
    });
    
    setImportData({ headers, rows });
    setColumnMappings(mappings);
    
    return { headers, rows, mappings };
  }, [fields]);

  // Update a column mapping
  const updateColumnMapping = useCallback((columnIndex: number, fieldId: string | null) => {
    setColumnMappings(prev => {
      return prev.map((mapping, idx) => {
        if (idx === columnIndex) {
          return {
            ...mapping,
            targetField: fieldId ? fields.find(f => f.id === fieldId) || null : null
          };
        }
        return mapping;
      });
    });
  }, [fields]);

  // Import the records to the database
  const importRecords = useCallback(async () => {
    if (!importData || !objectTypeId) return;

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process each row of data
      for (const row of importData.rows) {
        try {
          // Create a new record in object_records
          const { data: recordData, error: recordError } = await supabase
            .from('object_records')
            .insert({
              object_type_id: objectTypeId
            })
            .select('id')
            .single();

          if (recordError) throw recordError;
          const recordId = recordData.id;

          // Create field values for each mapped column
          const fieldValues = [];
          for (const mapping of columnMappings) {
            if (mapping.targetField) {
              const value = row[mapping.sourceColumnIndex] || '';
              fieldValues.push({
                record_id: recordId,
                field_api_name: mapping.targetField.api_name,
                value
              });
            }
          }

          // Insert field values
          if (fieldValues.length > 0) {
            const { error: valuesError } = await supabase
              .from('object_field_values')
              .insert(fieldValues);

            if (valuesError) throw valuesError;
          }
          
          successCount++;
        } catch (error) {
          console.error("Error importing row:", error);
          errorCount++;
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      
      // Show success message
      toast.success(
        `Import completed: ${successCount} records imported${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      );
      
      return { success: successCount, errors: errorCount };
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import records");
      return { success: 0, errors: importData.rows.length };
    } finally {
      setIsImporting(false);
    }
  }, [importData, objectTypeId, columnMappings, queryClient]);

  return {
    importData,
    columnMappings,
    isImporting,
    parseImportText,
    updateColumnMapping,
    importRecords
  };
}
