
import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ReportDefinition } from "@/types/report";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { 
  migrateLocalReportsToDatabase,
  formatDatabaseReports
} from "@/utils/reportMigrationUtils";
import {
  fetchUserReports,
  createDatabaseReport,
  updateDatabaseReport,
  deleteDatabaseReport,
  updateLastViewedReport,
  duplicateDatabaseReport
} from "@/services/reportService";

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
    const loadReports = async () => {
      if (!userId) {
        setReports([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const { data, error: fetchError } = await fetchUserReports(userId);
        
        if (fetchError) throw fetchError;
        
        console.log("[useReports] Fetched reports from database:", data);
        setReports(data);
        
        // Find the most recently viewed report
        const mostRecentlyViewed = data.reduce((most, report) => {
          if (!most || !most.last_viewed_at) return report;
          if (!report.last_viewed_at) return most;
          return new Date(report.last_viewed_at) > new Date(most.last_viewed_at) ? report : most;
        }, null as (ReportDefinition & { last_viewed_at?: string }) | null);
        
        if (mostRecentlyViewed?.id) {
          setLastViewedReport(mostRecentlyViewed.id);
        }
      } catch (err) {
        console.error("[useReports] Error fetching reports:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch reports"));
        toast.error("Failed to load your reports");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Handle migrating local reports to database
    const handleMigration = async () => {
      if (userId && Array.isArray(localReports) && localReports.length > 0) {
        const migrationSuccessful = await migrateLocalReportsToDatabase(userId, localReports);
        if (migrationSuccessful) {
          // Clear local storage since we're now using the database
          setLocalReports([]);
          // Reload reports from the database
          loadReports();
        }
      }
    };
    
    loadReports();
    handleMigration();
    
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
  
  // Create a new report
  const createReport = useCallback(async (name: string, objectTypeId: string, description?: string) => {
    if (!userId) {
      toast.error("You must be logged in to create reports");
      return null;
    }
    
    const newReport = await createDatabaseReport(userId, name, objectTypeId, description);
    
    if (newReport) {
      console.log("[useReports] Created new report:", newReport);
      
      // Update local state
      setReports(prev => [newReport, ...prev]);
      
      toast.success("Report created", {
        description: `"${name}" has been created successfully`
      });
    }
    
    return newReport;
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
      
      const { success, error: updateError } = await updateDatabaseReport(userId, reportId, updates);
      
      if (!success) throw updateError;
      
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
      
      const { success, error: deleteError } = await deleteDatabaseReport(userId, reportId);
      
      if (!success) throw deleteError;
      
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
      
      const { report: newReport, error: dupError } = await duplicateDatabaseReport(
        userId, 
        reportId, 
        reportToCopy
      );
      
      if (!newReport) throw dupError;
      
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
  const updateReportLastViewed = useCallback(async (reportId: string) => {
    if (!userId || !reportId) {
      console.warn("[useReports] No userId or reportId provided for tracking");
      return;
    }
    
    const { success } = await updateLastViewedReport(userId, reportId);
    
    if (success) {
      console.log(`[useReports] Setting last viewed report: ${reportId}`);
      setLastViewedReport(reportId);
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
    updateLastViewedReport: updateReportLastViewed
  };
}
