
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash, Copy } from "lucide-react";
import { ReportDefinition } from "@/types/report";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useReports } from "@/hooks/useReports";
import { format } from "date-fns";

interface SavedReportsListProps {
  reports: ReportDefinition[];
  onEdit: (reportId: string) => void;
}

export function SavedReportsList({ reports, onEdit }: SavedReportsListProps) {
  const navigate = useNavigate();
  const { deleteReport, duplicateReport, updateLastViewedReport } = useReports();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  
  // Safety check to ensure reports is an array and logging
  const safeReports = Array.isArray(reports) ? reports : [];
  
  useEffect(() => {
    console.log("SavedReportsList received reports:", reports);
  }, [reports]);
  
  const handleViewReport = (reportId: string) => {
    console.log("Viewing report:", reportId);
    updateLastViewedReport(reportId);
    navigate(`/reports/${reportId}`);
  };
  
  const handleDeleteClick = (reportId: string) => {
    setReportToDelete(reportId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (reportToDelete) {
      deleteReport(reportToDelete);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };
  
  const handleDuplicate = (reportId: string) => {
    const newReport = duplicateReport(reportId);
    if (newReport) {
      console.log("Duplicated report:", newReport);
      updateLastViewedReport(newReport.id);
      navigate(`/reports/${newReport.id}`);
    }
  };
  
  if (safeReports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">Keine Berichte gefunden. Erstellen Sie Ihren ersten Bericht.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeReports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Button variant="link" className="p-0 h-auto" onClick={() => handleViewReport(report.id)}>
                      {report.name}
                    </Button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.description || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.updated_at ? format(new Date(report.updated_at), 'MMM d, yyyy') : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(report.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(report.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(report.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
