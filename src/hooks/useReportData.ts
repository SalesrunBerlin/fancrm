
import { useQuery } from "@tanstack/react-query";
import { ReportDefinition, ReportData } from "@/types/report";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectRelationships } from "@/hooks/useObjectRelationships";
import { useMemo } from "react";

// Define a more specific return type for the query result
interface ReportQueryResult {
  columns: string[];
  columnDefs?: { key: string; header: string; objectName: string; }[];
  rows: Record<string, any>[];
  totalCount: number;
}

export function useReportData(report: ReportDefinition) {
  const { objectTypes } = useObjectTypes();
  
  // Safety check for invalid report
  if (!report) {
    return {
      data: { columns: [], rows: [], columnDefs: [], totalCount: 0 } as ReportQueryResult,
      isLoading: false,
      error: new Error("Invalid or undefined report"),
    };
  }
  
  // Safety check for report with no objects
  if (!report?.objectIds || report.objectIds.length === 0) {
    return {
      data: { columns: [], rows: [], columnDefs: [], totalCount: 0 } as ReportQueryResult,
      isLoading: false,
      error: new Error("No objects selected for this report"),
    };
  }
  
  // Memoize objectIds to prevent unnecessary re-fetching
  // Ensure we have proper dependency arrays that can never be undefined
  const objectIds = useMemo(() => report.objectIds || [], [report?.id || 'unknown']);
  
  // Fixed JSON.stringify to handle potential undefined values
  const filters = useMemo(() => report.filters || [], [report?.id || 'unknown', JSON.stringify(report.filters || [])]);
  
  const selectedFields = useMemo(() => report.selectedFields || [], [report?.id || 'unknown', JSON.stringify(report.selectedFields || [])]);
  
  // Fetch records for each object in the report with memoization
  // Ensure we pass empty arrays as fallbacks for all dependencies
  const objectDataQueries = useMemo(() => (objectIds || []).map(objectTypeId => {
    // Filter by fields in this object
    const objectFilters = (filters || []).filter(f => 
      (selectedFields || [])
        .filter(sf => sf.objectTypeId === objectTypeId)
        .some(sf => sf.fieldApiName === f.fieldApiName)
    );
    
    const { records, isLoading, error } = useObjectRecords(
      objectTypeId, 
      objectFilters
    );
    
    // Get fields for this object
    const { fields } = useObjectFields(objectTypeId);
    
    return {
      objectTypeId,
      records: records || [],
      fields: fields || [],
      isLoading,
      error
    };
  }), [objectIds.join(','), JSON.stringify(filters), JSON.stringify(selectedFields)]);
  
  // Fetch relationships with memoization
  const relationshipsQueries = useMemo(() => (objectIds || []).map(objectTypeId => {
    const { relationships } = useObjectRelationships(objectTypeId);
    return { objectTypeId, relationships: relationships || [] };
  }), [objectIds.join(',')]);
  
  // Process and join data
  const result = useQuery({
    queryKey: ["report-data", report?.id || 'unknown', objectIds.join(','), JSON.stringify(filters || []), JSON.stringify(selectedFields || [])],
    queryFn: async (): Promise<ReportQueryResult> => {
      console.log("Processing report data for:", report?.name, "ID:", report?.id);
      
      // Check if data is still loading
      if (objectDataQueries.some(q => q.isLoading)) {
        console.log("Some object data is still loading");
        return { columns: [], columnDefs: [], rows: [], totalCount: 0 };
      }
      
      // Check for any errors
      const errors = objectDataQueries.filter(q => q.error);
      if (errors.length > 0) {
        console.error("Error fetching data:", errors[0].error);
        throw new Error(`Error fetching data: ${errors[0].error}`);
      }
      
      // Safety check for no objects
      if (!objectIds.length) {
        console.warn("No object IDs in report");
        return { columns: [], columnDefs: [], rows: [], totalCount: 0 };
      }
      
      // Get object names for better display
      const objectNames = objectTypes?.reduce((acc, obj) => {
        if (obj && obj.id) {
          acc[obj.id] = obj.name;
        }
        return acc;
      }, {} as Record<string, string>) || {};
      
      // Prepare columns based on selected fields
      const visibleFields = (selectedFields || [])
        .filter(f => f.isVisible)
        .sort((a, b) => a.order - b.order);
      
      console.log("Visible fields:", visibleFields);
      
      // Safety check for no visible fields
      if (visibleFields.length === 0) {
        console.warn("No visible fields in report");
        return { columns: [], columnDefs: [], rows: [], totalCount: 0 };
      }
      
      const columnDefs = visibleFields.map(field => {
        // Find field details for proper display name
        const objectData = objectDataQueries.find(q => q.objectTypeId === field.objectTypeId);
        const fieldDef = objectData?.fields.find(f => f.api_name === field.fieldApiName);
        
        return {
          key: `${field.objectTypeId}_${field.fieldApiName}`,
          header: field.displayName || fieldDef?.name || field.fieldApiName,
          objectName: objectNames[field.objectTypeId] || "Unknown Object"
        };
      });
      
      console.log("Column definitions:", columnDefs);
      
      // Ensure we have valid column definitions before proceeding
      if (!columnDefs.length) {
        return { columns: [], columnDefs: [], rows: [], totalCount: 0 };
      }
      
      // For single-object reports, just return the data
      if (objectIds.length === 1) {
        const primaryObjectData = objectDataQueries[0];
        
        // Handle case where records might be undefined
        if (!primaryObjectData || !primaryObjectData.records) {
          console.warn("No records found for primary object");
          return { 
            columns: columnDefs.map(c => c.key), 
            columnDefs: columnDefs,
            rows: [], 
            totalCount: 0 
          };
        }
        
        console.log(`Found ${primaryObjectData.records.length} records for primary object`);
        
        // Format rows based on selected fields
        const rows = primaryObjectData.records.map(record => {
          const row: Record<string, any> = { id: record.id };
          
          visibleFields.forEach(field => {
            const key = `${field.objectTypeId}_${field.fieldApiName}`;
            
            // Handle system fields vs custom fields
            if (["id", "created_at", "updated_at", "record_id"].includes(field.fieldApiName)) {
              row[key] = record[field.fieldApiName as keyof typeof record];
            } else {
              // Safely access field_values which might be undefined
              row[key] = record.field_values?.[field.fieldApiName];
            }
          });
          
          return row;
        });
        
        return {
          columns: columnDefs.map(c => c.key),
          columnDefs: columnDefs,
          rows,
          totalCount: rows.length
        };
      }
      
      // For multi-object reports - safety implementation
      return {
        columns: columnDefs.map(c => c.key),
        columnDefs: columnDefs,
        rows: [],
        totalCount: 0
      };
    },
    enabled: !!report && !!(objectIds && objectIds.length) && !objectDataQueries.some(q => q.isLoading),
    staleTime: 30000, // Cache data for 30 seconds to prevent constant refetching
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
  
  return {
    data: result.data,
    isLoading: result.isLoading || objectDataQueries.some(q => q.isLoading),
    error: result.error || objectDataQueries.find(q => q.error)?.error,
    refetch: result.refetch
  };
}
