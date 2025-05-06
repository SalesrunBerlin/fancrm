
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportDefinition } from "@/types/report";
import { useReportData } from "@/hooks/useReportData";
import { AlertCircle, Loader } from "lucide-react";

interface ReportDisplayProps {
  report: ReportDefinition;
}

export function ReportDisplay({ report }: ReportDisplayProps) {
  console.log("Rendering ReportDisplay with report:", report);
  
  // Ensure report is valid before proceeding
  if (!report || !report.id) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-amber-100 rounded-full">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-medium">Invalid Report</h3>
          <p className="text-muted-foreground">
            The report definition is missing or invalid.
          </p>
        </div>
      </Card>
    );
  }
  
  const { data, isLoading, error } = useReportData(report);
  
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-medium">Error loading report data</h3>
          <p className="text-muted-foreground text-center">
            {error instanceof Error ? error.message : "An error occurred while loading the report data"}
          </p>
        </div>
      </Card>
    );
  }
  
  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No data found for this report</p>
      </Card>
    );
  }

  // Safely check if columnDefs exists and has length before using it
  const columnDefs = data.columnDefs || [];
  const columns = data.columns || [];
  const hasColumnDefs = Array.isArray(columnDefs) && columnDefs.length > 0;
  const hasColumns = Array.isArray(columns) && columns.length > 0;
  
  // If we have neither column definitions nor columns, show a message
  if (!hasColumnDefs && !hasColumns) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No columns defined for this report</p>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hasColumnDefs ? 
                // Use columnDefs if available
                columnDefs.map((column, index) => (
                  <TableHead key={index}>{column.header}</TableHead>
                ))
                : 
                // Fall back to simple columns array
                hasColumns ? 
                  columns.map((column, index) => (
                    <TableHead key={index}>{column}</TableHead>
                  )) : 
                  <TableHead>No columns defined</TableHead>
              }
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {hasColumnDefs ? 
                  // Use columnDefs for structured data
                  columnDefs.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {formatCellValue(row[column.key])}
                    </TableCell>
                  ))
                  : 
                  // Fall back to columns array
                  hasColumns ? 
                    columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {formatCellValue(row[column])}
                      </TableCell>
                    )) :
                    <TableCell>No data</TableCell>
                }
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Helper function to format cell values for display
function formatCellValue(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return "—";
  }
  
  if (typeof value === 'boolean') {
    return value ? "Yes" : "No";
  }
  
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}
