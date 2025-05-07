
import React from "react";
import { useNavigate } from "react-router-dom";
import { useReports } from "@/hooks/useReports";
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, FilePlus2, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SavedReportsList() {
  const navigate = useNavigate();
  const { reports, isLoading, updateReportLastViewed } = useReports();
  const [search, setSearch] = React.useState("");
  
  const handleReportClick = (reportId: string) => {
    // Update last viewed timestamp
    updateReportLastViewed(reportId);
    // Navigate to report view
    navigate(`/reports/${reportId}`);
  };
  
  const handleCreateReport = () => {
    navigate("/reports/new");
  };
  
  const filteredReports = reports.filter(report => 
    report.name.toLowerCase().includes(search.toLowerCase()) || 
    (report.description && report.description.toLowerCase().includes(search.toLowerCase()))
  );
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Saved Reports</CardTitle>
          <Button onClick={handleCreateReport} size="sm">
            <FilePlus2 className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>
        <CardDescription>View, edit, and manage your saved reports</CardDescription>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search reports..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full max-h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-4">
                {search ? "No reports match your search" : "No reports have been created yet"}
              </p>
              <Button onClick={handleCreateReport} variant="outline">
                Create your first report
              </Button>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleReportClick(report.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium leading-none">{report.name}</h3>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="ml-2 h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/reports/${report.id}/edit`);
                        }}
                      >
                        <span className="sr-only">Edit report</span>
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      <span>Updated {formatDistanceToNow(new Date(report.updated_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 p-2">
        <p className="text-xs text-muted-foreground">
          {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"} available
        </p>
      </CardFooter>
    </Card>
  );
}
