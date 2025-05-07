
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReports } from "@/hooks/useReports";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Edit, FileDown, FileCog, Share } from "lucide-react";
import { ReportDisplay } from "@/components/reports/ReportDisplay";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportViewPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { reports, isLoading, error, getReportById, updateReportLastViewed } = useReports();
  
  useEffect(() => {
    if (reportId) {
      // Update last viewed timestamp
      updateReportLastViewed(reportId);
    }
  }, [reportId, updateReportLastViewed]);
  
  const report = reportId ? getReportById(reportId) : null;
  
  const handleEditReport = () => {
    navigate(`/reports/${reportId}/edit`);
  };
  
  const handleExportReport = () => {
    // TODO: Implement export functionality
    console.log("Export report:", reportId);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="p-4 bg-red-100 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-xl font-medium mb-2">Error Loading Report</h1>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
        <Button onClick={() => navigate("/reports")}>
          Return to Reports
        </Button>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="p-4 bg-amber-100 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-xl font-medium mb-2">Report Not Found</h1>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          The report you are looking for does not exist or has been deleted.
        </p>
        <Button onClick={() => navigate("/reports")}>
          Return to Reports
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={report.name}
        description={report.description || "Report details and data visualization"}
        backTo="/reports"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReport}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleEditReport}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Report
            </Button>
          </div>
        }
      />
      
      <ReportDisplay report={report} />
    </div>
  );
}
