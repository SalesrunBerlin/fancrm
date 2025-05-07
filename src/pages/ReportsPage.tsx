
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SavedReportsList } from "@/components/reports/SavedReportsList";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useReports } from "@/hooks/useReports";

export default function ReportsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("saved");
  const { reports, isLoading } = useReports();

  // If new report is created, switch to it
  const handleReportCreated = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports" 
        description="View and create reports"
        actions={
          <Button onClick={() => setActiveTab("create")}>
            <Plus className="mr-2 h-4 w-4" /> Create Report
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          <TabsTrigger value="create">Create Report</TabsTrigger>
        </TabsList>
        
        <TabsContent value="saved" className="space-y-4">
          <SavedReportsList />
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4">
          <ReportBuilder onReportCreated={handleReportCreated} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
