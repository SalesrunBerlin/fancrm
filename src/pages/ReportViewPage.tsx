
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Edit, AlertTriangle } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { ReportDisplay } from "@/components/reports/ReportDisplay";
import { useState, useEffect } from "react";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { Card } from "@/components/ui/card";

export default function ReportViewPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { getReportById, updateLastViewedReport } = useReports();
  const [isEditing, setIsEditing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load report data
  useEffect(() => {
    if (reportId) {
      console.log(`Loading report with ID: ${reportId}`);
      const loadedReport = getReportById(reportId);
      
      if (loadedReport) {
        console.log("Found report:", loadedReport);
        setReport(loadedReport);
        updateLastViewedReport(reportId);
      } else {
        console.error("Report not found:", reportId);
      }
      
      setIsLoading(false);
    }
  }, [reportId, getReportById, updateLastViewedReport]);
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-amber-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold">Report nicht gefunden</h2>
          <p className="text-muted-foreground mt-2">
            Der gesuchte Bericht existiert nicht oder wurde gelöscht.
          </p>
          <Button onClick={() => navigate("/reports")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Berichtsliste
          </Button>
        </div>
      </div>
    );
  }
  
  const handleExportCSV = () => {
    // Export functionality will be implemented in ReportDisplay component
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCloseEdit = () => {
    setIsEditing(false);
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
