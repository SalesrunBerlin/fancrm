
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReportDefinition } from "@/types/report";
import { useObjectTypes } from "@/hooks/useObjectTypes";

export function useReportData(report: ReportDefinition, retrySignal: number = 0) {
  const { objectTypes } = useObjectTypes();
  const [columns, setColumns] = useState<string[]>([]);
  const [columnDefs, setColumnDefs] = useState<Array<{key: string, header: string}>>([]); 

  // Enhanced query preparation function with better error handling
  const prepareQuery = useCallback(async () => {
    try {
      console.log("Preparing report query for:", report);
      
      if (!report || !report.objectIds || !Array.isArray(report.objectIds) || report.objectIds.length === 0) {
        throw new Error("Invalid report: No object IDs specified");
      }
      
      if (!report.selectedFields || !Array.isArray(report.selectedFields) || report.selectedFields.length === 0) {
        throw new Error("Invalid report: No fields selected");
      }
      
      // Get primary object ID (first in list)
      const primaryObjectId = report.objectIds[0];
      console.log("Primary object ID:", primaryObjectId);
      
      // Find object type info
      const objectType = objectTypes?.find(obj => obj.id === primaryObjectId);
      if (!objectType) {
        throw new Error(`Object type with ID ${primaryObjectId} not found`);
      }
      
      console.log("Object type found:", objectType);
      
      // Prepare column definitions
      const columnDefinitions = report.selectedFields.map(field => {
        return {
          key: field.fieldApiName,
          header: field.displayName || field.fieldApiName
        };
      });
      
      setColumnDefs(columnDefinitions);
      setColumns(columnDefinitions.map(col => col.key));
      
      console.log("Column definitions prepared:", columnDefinitions);
      
      // Get records from the object
      const { data, error } = await supabase
        .from("object_records")
        .select(`
          id, 
          record_id,
          object_field_values (field_api_name, value)
        `)
        .eq("object_type_id", primaryObjectId)
        .limit(100);
        
      if (error) {
        console.error("Supabase query error:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data || !Array.isArray(data)) {
        console.warn("No data returned from query");
        return { 
          rows: [], 
          columns, 
          columnDefs
        };
      }
      
      console.log("Raw data from database:", data);
      
      // Process the rows into a flattened format
      const rows = data.map(record => {
        const row: Record<string, any> = {
          id: record.id,
          record_id: record.record_id,
        };
        
        // Add field values
        if (record.object_field_values && Array.isArray(record.object_field_values)) {
          record.object_field_values.forEach((fieldValue: any) => {
            if (fieldValue.field_api_name && columnDefinitions.some(col => col.key === fieldValue.field_api_name)) {
              row[fieldValue.field_api_name] = fieldValue.value;
            }
          });
        }
        
        return row;
      });
      
      console.log("Processed rows:", rows);
      
      return {
        rows,
        columns,
        columnDefs
      };
    } catch (error) {
      console.error("Error in prepareQuery:", error);
      throw error;
    }
  }, [report, objectTypes]);

  // Use React Query for data fetching with caching and retry logic
  const { data, isLoading, error } = useQuery({
    queryKey: ['report-data', report?.id, retrySignal],
    queryFn: prepareQuery,
    enabled: Boolean(report?.id) && Boolean(objectTypes?.length),
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 60000, // 1 minute
  });

  return {
    data,
    isLoading,
    error,
  };
}
