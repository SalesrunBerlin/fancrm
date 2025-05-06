
import { ReportDefinition } from "@/types/report";
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
      selected_fields: report.selectedFields,
      filters: report.filters || [],
      created_at: report.created_at,
      updated_at: report.updated_at
    }));
    
    const { error } = await supabase
      .from("reports")
      .insert(reportsToInsert);
      
    if (error) throw error;
    
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
  
  return data.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description || "",
    objectIds: item.object_ids,
    selectedFields: item.selected_fields,
    filters: item.filters || [],
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
};
