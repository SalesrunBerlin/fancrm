
import { useCallback, useMemo, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ReportDefinition, ReportField } from "@/types/report";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { toast } from "sonner";

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
  // Use storage key with a version to enable future migrations if needed
  const [reports, setReports] = useLocalStorage<ReportDefinition[]>("reports-v1", []);
  const [lastViewedReport, setLastViewedReport] = useLocalStorage<string | null>(
    "last-viewed-report-v1", 
    null
  );
  
  // Safety check to ensure reports is always an array
  useEffect(() => {
    if (!Array.isArray(reports)) {
      console.warn("[useReports] Reports is not an array, resetting to []");
      setReports([]);
    }
  }, [reports, setReports]);
  
  // Log state for debugging
  useMemo(() => {
    console.log("[useReports] Saved reports:", reports);
    console.log("[useReports] Last viewed report:", lastViewedReport);
  }, [reports, lastViewedReport]);
  
  // Get a report by its ID
  const getReportById = useCallback((reportId: string) => {
    if (!Array.isArray(reports)) {
      console.warn("[useReports] Reports data is corrupted, not an array");
      return null;
    }
    
    console.log(`[useReports] Looking for report with ID: ${reportId}`, reports);
    const report = reports.find(r => r && r.id === reportId);
    console.log(`[useReports] Found report:`, report);
    return report || null;
  }, [reports]);
  
  // Create a new report
  const createReport = useCallback((name: string, objectTypeId: string, description?: string): ReportDefinition => {
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
    
    setReports(prev => {
      // Safety check for previous state
      const validPrev = Array.isArray(prev) ? prev : [];
      
      console.log("[useReports] Creating new report:", newReport);
      const updatedReports = [newReport, ...validPrev];
      console.log("[useReports] Updated reports list:", updatedReports);
      return updatedReports;
    });
    
    toast.success("Report created", {
      description: `"${name}" has been created successfully`
    });
    
    return newReport;
  }, [setReports]);
  
  // Update an existing report
  const updateReport = useCallback((reportId: string, updates: Partial<Omit<ReportDefinition, "id" | "created_at">>) => {
    setReports(prev => {
      // Safety check for previous state
      const validPrev = Array.isArray(prev) ? prev : [];
      
      console.log(`[useReports] Updating report ${reportId} with:`, updates);
      const reportExists = validPrev.some(report => report && report.id === reportId);
      
      if (!reportExists) {
        console.error(`[useReports] Cannot update report - report with ID ${reportId} not found`);
        return validPrev;
      }
      
      const updatedReports = validPrev.map(report => 
        report && report.id === reportId 
          ? { 
              ...report, 
              ...updates, 
              updated_at: new Date().toISOString() 
            } 
          : report
      );
      console.log("[useReports] Updated reports list:", updatedReports);
      return updatedReports;
    });
    
    toast.success("Report updated", {
      description: `Changes have been saved successfully`
    });
  }, [setReports]);
  
  // Delete a report
  const deleteReport = useCallback((reportId: string) => {
    const reportToDelete = getReportById(reportId);
    if (reportToDelete) {
      setReports(prev => {
        // Safety check for previous state
        const validPrev = Array.isArray(prev) ? prev : [];
        
        console.log(`[useReports] Deleting report ${reportId}`);
        const updatedReports = validPrev.filter(report => report && report.id !== reportId);
        console.log("[useReports] Updated reports list:", updatedReports);
        return updatedReports;
      });
      
      toast.success("Report deleted", {
        description: `"${reportToDelete.name}" has been deleted`
      });
      
      if (lastViewedReport === reportId) {
        setLastViewedReport(null);
      }
    }
  }, [getReportById, setReports, lastViewedReport, setLastViewedReport]);
  
  // Duplicate a report
  const duplicateReport = useCallback((reportId: string) => {
    const reportToCopy = getReportById(reportId);
    if (reportToCopy) {
      const newReport: ReportDefinition = {
        ...reportToCopy,
        id: crypto.randomUUID(),
        name: `${reportToCopy.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setReports(prev => {
        // Safety check for previous state
        const validPrev = Array.isArray(prev) ? prev : [];
        
        console.log("[useReports] Duplicating report:", newReport);
        const updatedReports = [newReport, ...validPrev];
        console.log("[useReports] Updated reports list:", updatedReports);
        return updatedReports;
      });
      
      toast.success("Report duplicated", {
        description: `Copy of "${reportToCopy.name}" has been created`
      });
      
      return newReport;
    }
    return null;
  }, [getReportById, setReports]);
  
  // Track which report was last viewed
  const updateLastViewedReport = useCallback((reportId: string) => {
    console.log(`[useReports] Setting last viewed report: ${reportId}`);
    setLastViewedReport(reportId);
  }, [setLastViewedReport]);
  
  return {
    reports: Array.isArray(reports) ? reports : [],
    lastViewedReport,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    duplicateReport,
    updateLastViewedReport
  };
}
