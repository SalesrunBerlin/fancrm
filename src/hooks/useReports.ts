
import { useCallback, useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ReportDefinition, ReportField } from "@/types/report";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Default report field selection
const getDefaultFields = (objectTypeId: string): ReportField[] => {
  return [{
    objectTypeId,
    fieldApiName: "created_at",
    displayName: "Created Date",
    isVisible: true,
    order: 0
  }];
};

export function useReports() {
  // Get user authentication info
  const { session } = useAuth();
  const userId = session?.user?.id;
  
  // State for reports and loading status
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastViewedReport, setLastViewedReport] = useState<string | null>(null);
  
  // Legacy localStorage for migration purposes
  const [localReports, setLocalReports] = useLocalStorage<ReportDefinition[]>("reports-v2", []);
  
  // Fetch reports from Supabase when user auth changes
  useEffect(() => {
    const fetchReports = async () => {
      if (!userId) {
        setReports([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .order("updated_at", { ascending: false });
          
        if (error) throw error;
        
        // Transform from database format to app format
        const formattedReports: ReportDefinition[] = data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          objectIds: item.object_ids,
          selectedFields: item.selected_fields,
          filters: item.filters || [],
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        
        console.log("[useReports] Fetched reports from database:", formattedReports);
        setReports(formattedReports);
        
        // Check for last viewed report
        if (item.last_viewed_at) {
          setLastViewedReport(item.id);
        }
      } catch (err) {
        console.error("[useReports] Error fetching reports:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch reports"));
        toast.error("Failed to load your reports");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Migrate local reports to database if needed
    const migrateLocalReports = async () => {
      if (!userId || !Array.isArray(localReports) || localReports.length === 0) {
        return;
      }
      
      console.log("[useReports] Migrating local reports to database:", localReports);
      
      try {
        // First check if user already has reports in the database
        const { data } = await supabase
          .from("reports")
          .select("id")
          .limit(1);
          
        if (data && data.length > 0) {
          // User already has reports, no need to migrate
          console.log("[useReports] User already has reports in database, skipping migration");
          // Clear local storage since we're now using the database
          setLocalReports([]);
          return;
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
        
        console.log("[useReports] Successfully migrated local reports to database");
        toast.success("Your reports have been successfully migrated to the cloud");
        
        // Clear local storage since we're now using the database
        setLocalReports([]);
      } catch (err) {
        console.error("[useReports] Error migrating reports:", err);
        toast.error("Failed to migrate your reports to the cloud");
      }
    };
    
    fetchReports();
    migrateLocalReports();
    
  }, [userId, localReports, setLocalReports]);
  
  // Get a report by its ID
  const getReportById = useCallback((reportId: string) => {
    if (!reportId) {
      console.warn("[useReports] No reportId provided");
      return null;
    }
    
    console.log(`[useReports] Looking for report with ID: ${reportId}`, reports);
    
    // Ensure we're doing a case-insensitive comparison
    const report = reports.find(r => r && r.id && r.id.toLowerCase() === reportId.toLowerCase());
    console.log(`[useReports] Found report:`, report);
    return report || null;
  }, [reports]);
  
  // Create a new report in the database
  const createReport = useCallback(async (name: string, objectTypeId: string, description?: string): Promise<ReportDefinition | null> => {
    if (!userId) {
      toast.error("You must be logged in to create reports");
      return null;
    }
    
    const newReport: ReportDefinition = {
      id: crypto.randomUUID(),
      name,
      description: description || "",
      objectIds: [objectTypeId],
      selectedFields: getDefaultFields(objectTypeId),
      filters: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      // Insert into database
      const { error } = await supabase
        .from("reports")
        .insert({
          id: newReport.id,
          name: newReport.name,
          description: newReport.description,
          user_id: userId,
          object_ids: newReport.objectIds,
          selected_fields: newReport.selectedFields,
          filters: newReport.filters
        });
        
      if (error) throw error;
      
      console.log("[useReports] Created new report:", newReport);
      
      // Update local state
      setReports(prev => [newReport, ...prev]);
      
      toast.success("Report created", {
        description: `"${name}" has been created successfully`
      });
      
      return newReport;
    } catch (err) {
      console.error("[useReports] Error creating report:", err);
      toast.error("Failed to create report");
      return null;
    }
  }, [userId]);
  
  // Update an existing report
  const updateReport = useCallback(async (reportId: string, updates: Partial<Omit<ReportDefinition, "id" | "created_at">>) => {
    if (!userId || !reportId) {
      console.error("[useReports] Missing userId or reportId for update");
      return;
    }

    try {
      console.log(`[useReports] Updating report ${reportId} with:`, updates);
      
      // First check if report exists and belongs to user
      const reportToUpdate = reports.find(r => r.id === reportId);
      if (!reportToUpdate) {
        console.error(`[useReports] Report with ID ${reportId} not found`);
        return;
      }
      
      // Prepare data for database update
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.objectIds) dbUpdates.object_ids = updates.objectIds;
      if (updates.selectedFields) dbUpdates.selected_fields = updates.selectedFields;
      if (updates.filters) dbUpdates.filters = updates.filters;
      
      // Update in database
      const { error } = await supabase
        .from("reports")
        .update(dbUpdates)
        .eq("id", reportId)
        .eq("user_id", userId);
        
      if (error) throw error;
      
      // Update local state
      setReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { 
                ...report, 
                ...updates, 
                updated_at: new Date().toISOString() 
              } 
            : report
        )
      );
      
      toast.success("Report updated", {
        description: `Changes have been saved successfully`
      });
    } catch (err) {
      console.error("[useReports] Error updating report:", err);
      toast.error("Failed to update report");
    }
  }, [userId, reports]);
  
  // Delete a report
  const deleteReport = useCallback(async (reportId: string) => {
    if (!userId || !reportId) {
      console.error("[useReports] Missing userId or reportId for delete");
      return;
    }
    
    try {
      const reportToDelete = getReportById(reportId);
      if (!reportToDelete) {
        console.error(`[useReports] Report with ID ${reportId} not found`);
        return;
      }
      
      // Delete from database
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId)
        .eq("user_id", userId);
        
      if (error) throw error;
      
      // Update local state
      setReports(prev => prev.filter(report => report.id !== reportId));
      
      toast.success("Report deleted", {
        description: `"${reportToDelete.name}" has been deleted`
      });
      
      if (lastViewedReport === reportId) {
        setLastViewedReport(null);
      }
    } catch (err) {
      console.error("[useReports] Error deleting report:", err);
      toast.error("Failed to delete report");
    }
  }, [userId, getReportById, lastViewedReport]);
  
  // Duplicate a report
  const duplicateReport = useCallback(async (reportId: string) => {
    if (!userId || !reportId) {
      console.error("[useReports] Missing userId or reportId for duplication");
      return null;
    }

    try {
      const reportToCopy = getReportById(reportId);
      if (!reportToCopy) {
        console.error(`[useReports] Report with ID ${reportId} not found`);
        return null;
      }
      
      const newReport: ReportDefinition = {
        ...reportToCopy,
        id: crypto.randomUUID(),
        name: `${reportToCopy.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert into database
      const { error } = await supabase
        .from("reports")
        .insert({
          id: newReport.id,
          name: newReport.name,
          description: newReport.description,
          user_id: userId,
          object_ids: newReport.objectIds,
          selected_fields: newReport.selectedFields,
          filters: newReport.filters
        });
        
      if (error) throw error;
      
      // Update local state
      setReports(prev => [newReport, ...prev]);
      
      toast.success("Report duplicated", {
        description: `Copy of "${reportToCopy.name}" has been created`
      });
      
      return newReport;
    } catch (err) {
      console.error("[useReports] Error duplicating report:", err);
      toast.error("Failed to duplicate report");
      return null;
    }
  }, [userId, getReportById]);
  
  // Track which report was last viewed
  const updateLastViewedReport = useCallback(async (reportId: string) => {
    if (!userId || !reportId) {
      console.warn("[useReports] No userId or reportId provided for tracking");
      return;
    }
    
    try {
      console.log(`[useReports] Setting last viewed report: ${reportId}`);
      
      // Update in database
      const { error } = await supabase
        .from("reports")
        .update({ last_viewed_at: new Date().toISOString() })
        .eq("id", reportId)
        .eq("user_id", userId);
        
      if (error) throw error;
      
      // Update local state
      setLastViewedReport(reportId);
    } catch (err) {
      console.error("[useReports] Error updating last viewed report:", err);
      // No need to show this error to the user as it's not critical
    }
  }, [userId]);
  
  return {
    reports,
    lastViewedReport,
    isLoading,
    error,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    duplicateReport,
    updateLastViewedReport
  };
}
