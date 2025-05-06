
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportDefinition } from "@/types/report";
import { useReportData } from "@/hooks/useReportData";
import { AlertCircle } from "lucide-react";

interface ReportDisplayProps {
  report: ReportDefinition;
}

export function ReportDisplay({ report }: ReportDisplayProps) {
  console.log("Rendering ReportDisplay with report:", report);
  
  const { data, isLoading, error } = useReportData(report);
  
  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Loading report data...</p>
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
            {error.message || "An error occurred while loading the report data"}
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
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {data.columnDefs?.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              )) || (
                data.columns?.map((column, index) => (
                  <TableHead key={index}>{column}</TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {(data.columnDefs || []).map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    {formatCellValue(row[column.key])}
                  </TableCell>
                ))}
                {!data.columnDefs && data.columns?.map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    {formatCellValue(row[column])}
                  </TableCell>
                ))}
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
  
  return value.toString();
}
