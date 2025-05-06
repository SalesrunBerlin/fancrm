
import { supabase } from "@/integrations/supabase/client";
import { ReportDefinition, ReportField } from "@/types/report";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { formatDatabaseReports } from "@/utils/reportMigrationUtils";

/**
 * Fetches all reports for a specific user
 */
export const fetchUserReports = async (userId: string | undefined) => {
  if (!userId) {
    return { data: [], error: new Error("User ID is required") };
  }

  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    
    if (error) throw error;
    
    return { 
      data: formatDatabaseReports(data || []),
      error: null
    };
  } catch (err) {
    console.error("[fetchUserReports] Error:", err);
    return { 
      data: [], 
      error: err instanceof Error ? err : new Error("Failed to fetch reports") 
    };
  }
};

/**
 * Creates a new report in the database
 */
export const createDatabaseReport = async (
  userId: string | undefined,
  name: string,
  objectTypeId: string,
  description?: string
): Promise<ReportDefinition | null> => {
  if (!userId) return null;
  
  const newReport = {
    id: crypto.randomUUID(),
    name,
    description: description || "",
    user_id: userId,
    object_ids: [objectTypeId],
    selected_fields: getDefaultFields(objectTypeId),
    filters: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    const { error } = await supabase
      .from("reports")
      .insert(newReport);
      
    if (error) throw error;
    
    return {
      id: newReport.id,
      name: newReport.name,
      description: newReport.description,
      objectIds: newReport.object_ids,
      selectedFields: newReport.selected_fields,
      filters: newReport.filters,
      created_at: newReport.created_at,
      updated_at: newReport.updated_at
    };
  } catch (err) {
    console.error("[createDatabaseReport] Error:", err);
    return null;
  }
};

/**
 * Updates an existing report
 */
export const updateDatabaseReport = async (
  userId: string | undefined,
  reportId: string, 
  updates: Partial<Omit<ReportDefinition, "id" | "created_at">>
) => {
  if (!userId || !reportId) {
    return { success: false, error: new Error("Missing userId or reportId") };
  }

  try {
    // Prepare data for database update
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.objectIds) dbUpdates.object_ids = updates.objectIds;
    if (updates.selectedFields) dbUpdates.selected_fields = updates.selectedFields;
    if (updates.filters) dbUpdates.filters = updates.filters;
    
    const { error } = await supabase
      .from("reports")
      .update(dbUpdates)
      .eq("id", reportId)
      .eq("user_id", userId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (err) {
    console.error("[updateDatabaseReport] Error:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error("Failed to update report") 
    };
  }
};

/**
 * Deletes a report by ID
 */
export const deleteDatabaseReport = async (
  userId: string | undefined,
  reportId: string
) => {
  if (!userId || !reportId) {
    return { success: false, error: new Error("Missing userId or reportId") };
  }
  
  try {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", reportId)
      .eq("user_id", userId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (err) {
    console.error("[deleteDatabaseReport] Error:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error("Failed to delete report") 
    };
  }
};

/**
 * Updates the last viewed timestamp for a report
 */
export const updateLastViewedReport = async (
  userId: string | undefined,
  reportId: string
) => {
  if (!userId || !reportId) {
    return { success: false, error: null }; // Silent failure, not critical
  }
  
  try {
    const { error } = await supabase
      .from("reports")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("id", reportId)
      .eq("user_id", userId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (err) {
    console.error("[updateLastViewedReport] Error:", err);
    return { success: false, error: null }; // Silent failure, not critical
  }
};

/**
 * Default report field selection
 */
const getDefaultFields = (objectTypeId: string): ReportField[] => {
  return [{
    objectTypeId,
    fieldApiName: "created_at",
    displayName: "Created Date",
    isVisible: true,
    order: 0
  }];
};

/**
 * Creates a duplicate of an existing report
 */
export const duplicateDatabaseReport = async (
  userId: string | undefined,
  originalReportId: string,
  originalReport: ReportDefinition
) => {
  if (!userId || !originalReportId || !originalReport) {
    return { report: null, error: new Error("Missing required data for duplication") };
  }
  
  try {
    const newReport = {
      id: crypto.randomUUID(),
      name: `${originalReport.name} (Copy)`,
      description: originalReport.description,
      user_id: userId,
      object_ids: originalReport.objectIds,
      selected_fields: originalReport.selectedFields,
      filters: originalReport.filters,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from("reports")
      .insert(newReport);
      
    if (error) throw error;
    
    return { 
      report: {
        id: newReport.id,
        name: newReport.name,
        description: newReport.description || "",
        objectIds: newReport.object_ids,
        selectedFields: newReport.selected_fields,
        filters: newReport.filters,
        created_at: newReport.created_at,
        updated_at: newReport.updated_at
      },
      error: null 
    };
  } catch (err) {
    console.error("[duplicateDatabaseReport] Error:", err);
    return { 
      report: null, 
      error: err instanceof Error ? err : new Error("Failed to duplicate report") 
    };
  }
};
