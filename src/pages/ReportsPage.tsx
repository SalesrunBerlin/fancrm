
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { SavedReportsList } from "@/components/reports/SavedReportsList";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { Card } from "@/components/ui/card";
import { useReports } from "@/hooks/useReports";

export default function ReportsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const { reports } = useReports();
  
  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingReportId(null);
  };
  
  const handleEditReport = (reportId: string) => {
    setEditingReportId(reportId);
    setIsCreating(true);
  };
  
  const handleCloseBuilder = () => {
    setIsCreating(false);
    setEditingReportId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports" 
        description="Create and view custom reports across your data"
        actions={
          !isCreating && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          )
        }
      />
      
      {isCreating ? (
        <ReportBuilder 
          reportId={editingReportId} 
          onClose={handleCloseBuilder} 
        />
      ) : (
        <div className="space-y-6">
          {reports.length > 0 ? (
            <SavedReportsList 
              reports={reports} 
              onEdit={handleEditReport}
            />
          ) : (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-medium">No reports yet</h3>
                <p className="text-muted-foreground">
                  Create your first report to analyze and visualize your data.
                </p>
                <Button onClick={handleCreateNew} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
