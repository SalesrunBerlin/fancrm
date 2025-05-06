
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { SavedReportsList } from "@/components/reports/SavedReportsList";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { Card } from "@/components/ui/card";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/contexts/AuthContext";

export default function ReportsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const { reports, isLoading, error } = useReports();
  const { session } = useAuth();
  
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
          !isCreating && session?.user && (
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
          {error ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 rounded-full bg-red-100">
                  <FileText className="h-12 w-12 text-red-500" />
                </div>
                <h3 className="text-xl font-medium">Error loading reports</h3>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : "An unexpected error occurred while loading your reports"}
                </p>
                <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                  Retry
                </Button>
              </div>
            </Card>
          ) : (
            <SavedReportsList 
              reports={reports} 
              onEdit={handleEditReport}
              isLoading={isLoading}
            />
          )}
        </div>
      )}
    </div>
  );
}
