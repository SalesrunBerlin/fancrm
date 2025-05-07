
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, FileText, BarChart } from "lucide-react";
import { SavedReportsList } from "@/components/reports/SavedReportsList";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { Card, CardContent } from "@/components/ui/card";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const editReportId = searchParams.get('edit');
  const createMode = searchParams.get('create') === 'true';
  
  const [isCreating, setIsCreating] = useState(createMode);
  const [editingReportId, setEditingReportId] = useState<string | null>(editReportId);
  const { reports, isLoading, error } = useReports();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  // Handle URL params for editing or creating
  useEffect(() => {
    if (createMode) {
      setIsCreating(true);
      setEditingReportId(null);
    } else if (editReportId) {
      setIsCreating(true);
      setEditingReportId(editReportId);
    }
  }, [createMode, editReportId]);
  
  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingReportId(null);
    setSearchParams({ create: 'true' });
  };
  
  const handleEditReport = (reportId: string) => {
    setEditingReportId(reportId);
    setIsCreating(true);
    setSearchParams({ edit: reportId });
  };
  
  const handleCloseBuilder = () => {
    setIsCreating(false);
    setEditingReportId(null);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports" 
        description="Create and view custom reports across your data"
        actions={
          !isCreating && session?.user && (
            <div className="flex gap-2">
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
              <Button variant="outline" asChild>
                <Link to="/reports/example">
                  <BarChart className="h-4 w-4 mr-2" />
                  Sample Report
                </Link>
              </Button>
            </div>
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
          {reports.length === 0 && !isLoading && !error && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">No reports yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Create custom reports to analyze your data or try our sample report to get started.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 pt-4">
                    <Button onClick={handleCreateNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Report
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/reports/example">Try Sample Report</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
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
              onEdit={handleEditReport}
            />
          )}
        </div>
      )}
    </div>
  );
}
