
import { useState, useEffect } from "react";
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
  const [reports, setReports] = useLocalStorage<ReportDefinition[]>("saved-reports", []);
  const [lastViewedReport, setLastViewedReport] = useLocalStorage<string | null>(
    "last-viewed-report", 
    null
  );
  
  const getReportById = (reportId: string) => {
    return reports.find(r => r.id === reportId) || null;
  };
  
  const createReport = (name: string, objectTypeId: string, description?: string): ReportDefinition => {
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
    
    setReports((prev: ReportDefinition[]) => {
      const updatedReports: ReportDefinition[] = [newReport, ...prev];
      return updatedReports;
    });
    
    toast.success("Report created", {
      description: `"${name}" has been created successfully`
    });
    
    return newReport;
  };
  
  const updateReport = (reportId: string, updates: Partial<Omit<ReportDefinition, "id" | "created_at">>) => {
    setReports((prev: ReportDefinition[]) => {
      const updatedReports: ReportDefinition[] = prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              ...updates, 
              updated_at: new Date().toISOString() 
            } 
          : report
      );
      return updatedReports;
    });
    
    toast.success("Report updated", {
      description: `Changes have been saved successfully`
    });
  };
  
  const deleteReport = (reportId: string) => {
    const reportToDelete = getReportById(reportId);
    if (reportToDelete) {
      setReports((prev: ReportDefinition[]) => {
        const updatedReports: ReportDefinition[] = prev.filter(report => report.id !== reportId);
        return updatedReports;
      });
      
      toast.success("Report deleted", {
        description: `"${reportToDelete.name}" has been deleted`
      });
      
      if (lastViewedReport === reportId) {
        setLastViewedReport(null);
      }
    }
  };
  
  const duplicateReport = (reportId: string) => {
    const reportToCopy = getReportById(reportId);
    if (reportToCopy) {
      const newReport: ReportDefinition = {
        ...reportToCopy,
        id: crypto.randomUUID(),
        name: `${reportToCopy.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setReports((prev: ReportDefinition[]) => {
        const updatedReports: ReportDefinition[] = [newReport, ...prev];
        return updatedReports;
      });
      
      toast.success("Report duplicated", {
        description: `Copy of "${reportToCopy.name}" has been created`
      });
      
      return newReport;
    }
    return null;
  };
  
  const updateLastViewedReport = (reportId: string) => {
    setLastViewedReport(reportId);
  };
  
  return {
    reports,
    lastViewedReport,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    duplicateReport,
    updateLastViewedReport
  };
}
