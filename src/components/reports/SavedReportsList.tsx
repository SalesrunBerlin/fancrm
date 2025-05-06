
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Edit, Copy, Trash, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ReportDefinition } from "@/types/report";
import { useReports } from "@/hooks/useReports";
import { useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedReportsListProps {
  reports: ReportDefinition[];
  onEdit: (reportId: string) => void;
}

export function SavedReportsList({ reports, onEdit }: SavedReportsListProps) {
  const navigate = useNavigate();
  const { deleteReport, duplicateReport } = useReports();
  const { objectTypes } = useObjectTypes();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  
  // Filter reports by search term
  const filteredReports = searchTerm
    ? reports.filter(report => 
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : reports;
  
  // Get object names for each report
  const getObjectNames = (objectIds: string[]) => {
    return objectIds
      .map(id => objectTypes?.find(obj => obj.id === id)?.name || "Unknown Object")
      .join(", ");
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  const handleView = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };
  
  const handleDuplicate = (reportId: string) => {
    const newReport = duplicateReport(reportId);
    if (newReport) {
      navigate(`/reports/${newReport.id}`);
    }
  };
  
  const confirmDelete = (reportId: string) => {
    setReportToDelete(reportId);
  };
  
  const handleDelete = () => {
    if (reportToDelete) {
      deleteReport(reportToDelete);
      setReportToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Objects</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map(report => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {report.name}
                    {report.description && (
                      <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                    )}
                  </TableCell>
                  <TableCell>{getObjectNames(report.objectIds)}</TableCell>
                  <TableCell>{formatDate(report.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleView(report.id)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(report.id)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDuplicate(report.id)}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Duplicate</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600"
                        onClick={() => confirmDelete(report.id)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchTerm 
                      ? "No reports match your search" 
                      : "No reports found. Create your first report."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!reportToDelete} onOpenChange={() => setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
