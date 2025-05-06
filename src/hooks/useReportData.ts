
import { useQuery } from "@tanstack/react-query";
import { ReportDefinition, ReportData } from "@/types/report";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectRelationships } from "@/hooks/useObjectRelationships";

export function useReportData(report: ReportDefinition) {
  const { objectTypes } = useObjectTypes();
  
  // Fetch records for each object in the report
  const objectDataQueries = report.objectIds.map(objectTypeId => {
    const { records, isLoading, error } = useObjectRecords(
      objectTypeId, 
      report.filters.filter(f => 
        // Filter by fields in this object
        report.selectedFields
          .filter(sf => sf.objectTypeId === objectTypeId)
          .some(sf => sf.fieldApiName === f.fieldApiName)
      )
    );
    
    // Get fields for this object
    const { fields } = useObjectFields(objectTypeId);
    
    return {
      objectTypeId,
      records,
      fields,
      isLoading,
      error
    };
  });
  
  // Fetch relationships to understand connections between objects
  const relationshipsQueries = report.objectIds.map(objectTypeId => {
    const { relationships } = useObjectRelationships(objectTypeId);
    return { objectTypeId, relationships };
  });
  
  // Process and join data
  const result = useQuery({
    queryKey: ["report-data", report.id, report.objectIds, report.filters, report.selectedFields],
    queryFn: async () => {
      // Check if data is still loading
      if (objectDataQueries.some(q => q.isLoading)) {
        return { columns: [], rows: [], totalCount: 0 };
      }
      
      // Check for any errors
      const errors = objectDataQueries.filter(q => q.error);
      if (errors.length > 0) {
        throw new Error(`Error fetching data: ${errors[0].error}`);
      }
      
      // Get object names for better display
      const objectNames = objectTypes?.reduce((acc, obj) => {
        acc[obj.id] = obj.name;
        return acc;
      }, {} as Record<string, string>) || {};
      
      // Prepare columns based on selected fields
      const visibleFields = report.selectedFields
        .filter(f => f.isVisible)
        .sort((a, b) => a.order - b.order);
      
      const columns = visibleFields.map(field => {
        // Find field details for proper display name
        const objectData = objectDataQueries.find(q => q.objectTypeId === field.objectTypeId);
        const fieldDef = objectData?.fields.find(f => f.api_name === field.fieldApiName);
        
        return {
          key: `${field.objectTypeId}_${field.fieldApiName}`,
          header: field.displayName || fieldDef?.name || field.fieldApiName,
          objectName: objectNames[field.objectTypeId] || "Unknown Object"
        };
      });
      
      // For single-object reports, just return the data
      if (report.objectIds.length === 1) {
        const primaryObjectData = objectDataQueries[0];
        
        // Format rows based on selected fields
        const rows = primaryObjectData.records?.map(record => {
          const row: Record<string, any> = { id: record.id };
          
          visibleFields.forEach(field => {
            const key = `${field.objectTypeId}_${field.fieldApiName}`;
            
            // Handle system fields vs custom fields
            if (["id", "created_at", "updated_at", "record_id"].includes(field.fieldApiName)) {
              row[key] = record[field.fieldApiName as keyof typeof record];
            } else {
              row[key] = record.field_values?.[field.fieldApiName];
            }
          });
          
          return row;
        }) || [];
        
        return {
          columns: columns.map(c => c.key),
          columnDefs: columns,
          rows,
          totalCount: rows.length
        };
      }
      
      // For multi-object reports, relationships need to be considered
      // This is a simplified implementation; real-world joins would be more complex
      
      // Start with primary object data
      const primaryObjectData = objectDataQueries[0];
      const rows: Record<string, any>[] = [];
      
      // This is a placeholder for more complex joining logic
      // In a real implementation, we would do proper joins based on relationships
      return {
        columns: columns.map(c => c.key),
        columnDefs: columns,
        rows,
        totalCount: rows.length
      };
    },
    enabled: report.objectIds.length > 0 && !objectDataQueries.some(q => q.isLoading),
  });
  
  return {
    data: result.data,
    isLoading: result.isLoading || objectDataQueries.some(q => q.isLoading),
    error: result.error || objectDataQueries.find(q => q.error)?.error,
    refetch: result.refetch
  };
}
