
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Edit } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { ReportDisplay } from "@/components/reports/ReportDisplay";
import { useState } from "react";
import { ReportBuilder } from "@/components/reports/ReportBuilder";

export default function ReportViewPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { getReportById } = useReports();
  const [isEditing, setIsEditing] = useState(false);
  
  const report = reportId ? getReportById(reportId) : null;
  
  if (!report) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Report not found</h2>
        <p className="text-muted-foreground mt-2">
          The report you are looking for does not exist or has been deleted.
        </p>
        <Button onClick={() => navigate("/reports")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
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
