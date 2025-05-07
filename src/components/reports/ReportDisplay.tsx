
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportDefinition } from "@/types/report";
import { useReportData } from "@/hooks/useReportData";
import { AlertCircle, Loader, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportDisplayProps {
  report: ReportDefinition;
}

export function ReportDisplay({ report }: ReportDisplayProps) {
  const [retryCount, setRetryCount] = useState(0);
  console.log("Rendering ReportDisplay with report:", report);
  
  // Handle retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    console.log("Retrying report data fetch");
  };
  
  // Validate report before proceeding
  if (!report || !report.id) {
    console.error("Invalid report definition:", report);
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

  // Enhanced validation for report structure
  const validationErrors = [];
  
  if (!Array.isArray(report.objectIds) || report.objectIds.length === 0) {
    validationErrors.push("This report doesn't have any objects selected");
    console.error("Report has no valid object IDs:", report);
  }

  if (!Array.isArray(report.selectedFields) || report.selectedFields.length === 0) {
    validationErrors.push("This report doesn't have any fields selected");
    console.error("Report has no selected fields:", report);
  }
  
  // Display validation errors if any
  if (validationErrors.length > 0) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-amber-100 rounded-full">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-medium">Incomplete Report</h3>
          <ul className="list-disc text-left mt-2 text-muted-foreground">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-2">
            Please edit the report to resolve these issues.
          </p>
        </div>
      </Card>
    );
  }
  
  const { data, isLoading, error } = useReportData(report, retryCount);
  
  console.log("Report data result:", { data, isLoading, error });
  
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
    console.error("Error in ReportDisplay:", error);
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-medium">Error loading report data</h3>
          <p className="text-muted-foreground text-center max-w-lg">
            {error instanceof Error ? error.message : "An error occurred while loading the report data"}
          </p>
          <Button onClick={handleRetry} variant="outline" className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" /> 
            Retry
          </Button>
        </div>
      </Card>
    );
  }
  
  if (!data) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-amber-100 rounded-full">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-medium">No Data Available</h3>
          <p className="text-muted-foreground">
            No data was returned for this report.
          </p>
          <Button onClick={handleRetry} variant="outline" className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" /> 
            Retry
          </Button>
        </div>
      </Card>
    );
  }
  
  if (!data.rows || data.rows.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No data found for this report</p>
        <Button onClick={handleRetry} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" /> 
          Refresh
        </Button>
      </Card>
    );
  }

  // Enhanced handling of column definitions
  const columnDefs = data.columnDefs || [];
  const columns = data.columns || [];
  const hasColumnDefs = Array.isArray(columnDefs) && columnDefs.length > 0;
  const hasColumns = Array.isArray(columns) && columns.length > 0;
  
  // Log columns for debugging
  console.log("Table columns:", hasColumnDefs ? columnDefs : columns);
  console.log("Table rows sample:", data.rows.slice(0, 2));
  
  if (!hasColumnDefs && !hasColumns) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-amber-100 rounded-full">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-medium">Report Format Error</h3>
          <p className="text-muted-foreground">
            The report data is missing column definitions. Please edit the report.
          </p>
        </div>
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
    try {
      return JSON.stringify(value);
    } catch (e) {
      return "[Complex Object]";
    }
  }
  
  return String(value);
}
