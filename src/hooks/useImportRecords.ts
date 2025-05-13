// Update imports to use the correct types
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DuplicateRecord } from '@/types';
import { findDuplicates } from '@/utils/importDuplicateUtils';
import { importRecords } from '@/services/recordImportService';

interface ColumnMapping {
  sourceColumnIndex: number;
  targetField: {
    id: string;
    name: string;
    api_name: string;
    description?: string;
    data_type: string;
    is_required: boolean;
    is_unique?: boolean;
    is_system?: boolean;
    default_value?: string | null;
    options?: any | null;
    object_type_id: string;
    display_order: number;
    owner_id?: string;
    created_at?: string;
    updated_at?: string;
  } | null;
}

interface UseImportRecordsProps {
  objectTypeId: string;
  fields: any[];
  onImportComplete: () => void;
}

export const useImportRecords = ({ objectTypeId, fields, onImportComplete }: UseImportRecordsProps) => {
  const { user } = useAuth();
  const [importData, setImportData] = useState<{ headers: string[], rows: string[][] } | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const setColumnMapping = (columnIndex: number, field: ColumnMapping['targetField']) => {
    setColumnMappings(prevMappings => {
      const newMappings = [...prevMappings];
      newMappings[columnIndex] = { sourceColumnIndex: columnIndex, targetField: field };
      return newMappings;
    });
  };

  const handleFileParsed = (data: { headers: string[], rows: string[][] }) => {
    setImportData(data);

    // Initialize column mappings with empty target fields
    const initialMappings: ColumnMapping[] = data.headers.map((_, index) => ({
      sourceColumnIndex: index,
      targetField: null,
    }));
    setColumnMappings(initialMappings);
    setSelectedRows(Array.from({ length: data.rows.length }, (_, i) => i)); // Initially select all rows
  };

  const handleCheckForDuplicates = async () => {
    if (!importData) return;

    const mappings = importData.headers.reduce((acc: Record<string, string>, header: string, index: number) => {
      const targetField = columnMappings[index]?.targetField;
      if (targetField) {
        acc[header] = targetField.api_name;
      }
      return acc;
    }, {});

    try {
      const { data: existingRecords, error } = await supabase
        .from('object_records')
        .select(`
          id,
          created_at,
          owner_id,
          object_type_id,
          field_values:object_field_values (
            record_id,
            field_api_name,
            value
          )
        `)
        .eq('object_type_id', objectTypeId);

      if (error) {
        console.error("Error fetching existing records:", error);
        toast.error("Error fetching existing records for duplicate check");
        return;
      }

      // Convert the data to the format expected by findDuplicates
      const formattedExistingRecords = existingRecords.map(record => {
        const fieldValues: Record<string, any> = {};
        if (record.field_values && Array.isArray(record.field_values)) {
          record.field_values.forEach(fieldValue => {
            fieldValues[fieldValue.field_api_name] = fieldValue.value;
          });
        }
        return { ...record, ...fieldValues };
      });

      const potentialDuplicates = findDuplicates(
        importData.rows,
        importData.headers,
        mappings,
        formattedExistingRecords,
        fields
      );

      setDuplicates(potentialDuplicates);
    } catch (error) {
      console.error("Error during duplicate check:", error);
      toast.error("Failed to check for duplicates");
    }
  };

  const handleImport = async () => {
    if (!importData) {
      toast.error("No data to import.");
      return;
    }

    setIsImporting(true);
    try {
      // Prepare column mappings in the correct format
      const mappedColumns = importData.headers.map((_, index) => ({
        sourceColumnIndex: index,
        targetField: columnMappings[index]?.targetField || null,
      }));

      // Call the importRecords service
      const { success, failures } = await importRecords(
        objectTypeId,
        importData,
        mappedColumns,
        selectedRows,
        duplicates.map(duplicate => ({
          ...duplicate,
          action: selectedRows.includes(duplicate.rowIndex) ? 'create' : 'skip', // Default action
          record: importData.rows[duplicate.rowIndex].reduce((record, value, index) => {
            const targetField = columnMappings[index]?.targetField;
            if (targetField) {
              record[targetField.api_name] = value;
            }
            return record;
          }, {} as Record<string, string>),
          importRowIndex: duplicate.rowIndex
        })),
        user
      );

      toast.success(`Successfully imported ${success} records. ${failures} failed.`);
      onImportComplete();
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Import failed. Please check the console for details.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSetDuplicateAction = (rowIndex: number, action: "create" | "ignore" | "update") => {
    setDuplicates(prevDuplicates =>
      prevDuplicates.map(duplicate =>
        duplicate.rowIndex === rowIndex ? { ...duplicate, action } : duplicate
      )
    );
  };

  const handleSelectAllRows = () => {
    if (!importData) return;
    const allRowIndices = Array.from({ length: importData.rows.length }, (_, i) => i);
    setSelectedRows(allRowIndices);
  };

  const handleClearAllRows = () => {
    setSelectedRows([]);
  };

  const handleIgnoreAllDuplicates = () => {
    setDuplicates(prevDuplicates =>
      prevDuplicates.map(duplicate => ({ ...duplicate, action: 'ignore' }))
    );
  };

  const handleCreateAllDuplicates = () => {
    setDuplicates(prevDuplicates =>
      prevDuplicates.map(duplicate => ({ ...duplicate, action: 'create' }))
    );
  };

  const handleUpdateAllDuplicates = () => {
    setDuplicates(prevDuplicates =>
      prevDuplicates.map(duplicate => ({ ...duplicate, action: 'update' }))
    );
  };

  return {
    importData,
    columnMappings,
    selectedRows,
    duplicates,
    isImporting,
    setColumnMapping,
    handleFileParsed,
    handleCheckForDuplicates,
    handleImport,
    handleSetDuplicateAction,
    setSelectedRows,
    handleSelectAllRows,
    handleClearAllRows,
    handleIgnoreAllDuplicates,
    handleCreateAllDuplicates,
    handleUpdateAllDuplicates
  };
};
