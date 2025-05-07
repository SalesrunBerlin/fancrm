
import { ReportDefinition, ReportField } from "@/types/report";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Migrates reports from local storage to the Supabase database
 */
export const migrateLocalReportsToDatabase = async (
  userId: string | undefined, 
  localReports: ReportDefinition[]
): Promise<boolean> => {
  if (!userId || !Array.isArray(localReports) || localReports.length === 0) {
    return false;
  }
  
  console.log("[migrateLocalReportsToDatabase] Migrating local reports to database:", localReports);
  
  try {
    // First check if user already has reports in the database
    const { data } = await supabase
      .from("reports")
      .select("id")
      .limit(1);
      
    if (data && data.length > 0) {
      // User already has reports, no need to migrate
      console.log("[migrateLocalReportsToDatabase] User already has reports in database, skipping migration");
      return true;
    }
    
    // Prepare reports for insertion with user_id
    const reportsToInsert = localReports.map(report => ({
      id: report.id,
      name: report.name,
      description: report.description || "",
      user_id: userId,
      object_ids: report.objectIds,
      selected_fields: JSON.stringify(report.selectedFields),
      filters: JSON.stringify(report.filters || []),
      created_at: report.created_at,
      updated_at: report.updated_at
    }));
    
    // Insert each report individually to avoid batch issues
    for (const reportData of reportsToInsert) {
      const { error } = await supabase
        .from("reports")
        .insert(reportData);
        
      if (error) {
        console.error("[migrateLocalReportsToDatabase] Error inserting report:", error);
        throw error;
      }
    }
    
    console.log("[migrateLocalReportsToDatabase] Successfully migrated local reports to database");
    toast.success("Your reports have been successfully migrated to the cloud");
    
    return true;
  } catch (err) {
    console.error("[migrateLocalReportsToDatabase] Error migrating reports:", err);
    toast.error("Failed to migrate your reports to the cloud");
    return false;
  }
};

/**
 * Transform database report format to application format
 */
export const formatDatabaseReports = (data: any[]): ReportDefinition[] => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => {
    // Parse fields that might be stored as strings but need to be objects
    let selectedFields: ReportField[] = [];
    let filters: FilterCondition[] = [];
    
    try {
      if (typeof item.selected_fields === 'string') {
        selectedFields = JSON.parse(item.selected_fields);
      } else {
        selectedFields = item.selected_fields || [];
      }
      
      if (typeof item.filters === 'string') {
        filters = JSON.parse(item.filters);
      } else {
        filters = item.filters || [];
      }
    } catch (err) {
      console.error('Error parsing report data:', err);
    }
    
    return {
      id: item.id,
      name: item.name,
      description: item.description || "",
      objectIds: item.object_ids || [],
      selectedFields: selectedFields,
      filters: filters,
      created_at: item.created_at,
      updated_at: item.updated_at,
      last_viewed_at: item.last_viewed_at
    };
  });
};
