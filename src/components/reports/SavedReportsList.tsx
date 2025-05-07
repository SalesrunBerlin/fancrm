
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Search,
  Eye,
  Trash2,
  Loader2,
  PieChart,
  LineChart,
} from "lucide-react";
import { format } from "date-fns";

export function SavedReportsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reports, isLoading, deleteReport } = useReports();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter reports by search term
  const filteredReports = reports?.filter((report) =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getReportIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "pie":
        return <PieChart className="h-5 w-5" />;
      case "line":
        return <LineChart className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No reports found</p>
          <Button onClick={() => navigate("/reports")}>Create Report</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports?.map((report) => (
          <Card key={report.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-2">
              <CardTitle className="flex items-center gap-2">
                {getReportIcon(report.chart_type)}
                <span className="truncate">{report.name}</span>
              </CardTitle>
              <CardDescription className="truncate">
                {report.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Object:</span>
                  <span className="font-medium">{report.object_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>
                    {report.created_at
                      ? format(new Date(report.created_at), "MMM d, yyyy")
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 p-3 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/reports/${report.id}`)}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteReport.mutate(report.id)}
                disabled={deleteReport.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
