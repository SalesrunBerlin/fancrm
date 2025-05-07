
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Edit, AlertTriangle, RefreshCw } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { ReportDisplay } from "@/components/reports/ReportDisplay";
import { useState, useEffect } from "react";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function ReportViewPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { getReportById, updateLastViewedReport, reports } = useReports();
  const [isEditing, setIsEditing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Add more detailed debug logging
  console.log("Current Route ReportId:", reportId);
  console.log("All available reports:", reports);
  
  // Load report data
  useEffect(() => {
    if (!reportId) {
      setIsLoading(false);
      setLoadError("No report ID provided");
      return;
    }
    
    const loadReport = () => {
      console.log(`Loading report with ID: ${reportId} (attempt ${retryCount + 1})`);
      setIsLoading(true);
      setLoadError(null);
      
      try {
        const loadedReport = getReportById(reportId);
        console.log("Raw report data:", loadedReport);
        
        if (!loadedReport) {
          console.error("Report not found:", reportId);
          setLoadError(`Report with ID ${reportId} not found`);
          setIsLoading(false);
          return;
        }
        
        // Enhanced validation to ensure report structure is valid
        if (!loadedReport.objectIds || !Array.isArray(loadedReport.objectIds)) {
          console.warn("Report has invalid or missing object IDs:", loadedReport);
          setLoadError("Report definition is incomplete (invalid object IDs format)");
          setIsLoading(false);
          return;
        }
        
        if (loadedReport.objectIds.length === 0) {
          console.warn("Report has empty object IDs array:", loadedReport);
          setLoadError("Report definition is incomplete (no object IDs selected)");
          setIsLoading(false);
          return;
        }
        
        if (!loadedReport.selectedFields || !Array.isArray(loadedReport.selectedFields)) {
          console.warn("Report has invalid selected fields:", loadedReport);
          setLoadError("Report definition is incomplete (invalid selected fields format)");
          setIsLoading(false);
          return;
        }
        
        if (loadedReport.selectedFields.length === 0) {
          console.warn("Report has no selected fields:", loadedReport);
          setLoadError("Report definition is incomplete (no fields selected)");
          setIsLoading(false);
          return;
        }

        // Format check for filters if present
        if (loadedReport.filters && !Array.isArray(loadedReport.filters)) {
          try {
            // Attempt to parse if it's a string
            if (typeof loadedReport.filters === 'string') {
              loadedReport.filters = JSON.parse(loadedReport.filters);
              console.log("Parsed filters from string:", loadedReport.filters);
            } else {
              console.warn("Report has non-array filters that couldn't be parsed:", loadedReport.filters);
              loadedReport.filters = []; // Set default empty array
            }
          } catch (error) {
            console.error("Error parsing filters:", error);
            loadedReport.filters = []; // Set default empty array
          }
        }
        
        // All validation passed, set the report
        console.log("Setting validated report:", loadedReport);
        setReport(loadedReport);
        
        // Track that this report was viewed (after successful validation)
        updateLastViewedReport(reportId);
        
        // Only show success toast after validation is complete
        toast.success(`Report "${loadedReport.name}" loaded successfully`);
        
        setIsLoading(false);
      } catch (error: any) {
        console.error("Error loading report:", error);
        setLoadError(error?.message || "Failed to load report");
        setIsLoading(false);
        toast.error("Failed to load report: " + (error?.message || "Unknown error"));
      }
    };
    
    loadReport();
  }, [reportId, getReportById, updateLastViewedReport, reports, retryCount]);
  
  // Handle retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" /> 
          Loading report...
        </p>
      </div>
    );
  }
  
  if (loadError || !report) {
    return (
      <div className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-amber-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold">Report nicht gefunden</h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            {loadError || "Der gesuchte Bericht existiert nicht oder wurde gelöscht."}
          </p>
          <div className="flex gap-4 mt-4">
            <Button onClick={() => navigate("/reports")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Berichtsliste
            </Button>
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Neu laden
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const handleExportCSV = () => {
    // Implement export functionality
    toast.info("Export CSV functionality will be implemented soon");
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCloseEdit = () => {
    setIsEditing(false);
    // Reload the report after editing to get latest changes
    if (reportId) {
      const refreshedReport = getReportById(reportId);
      if (refreshedReport) {
        console.log("Refreshed report after edit:", refreshedReport);
        setReport(refreshedReport);
      } else {
        // If the report was deleted during editing
        setLoadError("Report no longer exists");
        toast.error("Report no longer exists");
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {isEditing ? (
        <ReportBuilder reportId={reportId} onClose={handleCloseEdit} />
      ) : (
        <>
          <PageHeader
            title={report.name}
            description={report.description || "Custom report"}
            backTo="/reports"
            actions={
              <>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Report
                </Button>
              </>
            }
          />
          
          <ReportDisplay report={report} />
        </>
      )}
    </div>
  );
}
