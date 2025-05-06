
import { useMemo } from "react";
import { ReportDefinition } from "@/types/report";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { useObjectTypes } from "@/hooks/useObjectTypes";

interface ReportDisplayProps {
  report: ReportDefinition;
}

export function ReportDisplay({ report }: ReportDisplayProps) {
  const { data, isLoading, error, refetch } = useReportData(report);
  const { objectTypes } = useObjectTypes();
  
  // Get visible fields
  const visibleFields = useMemo(() => 
    report.selectedFields.filter(f => f.isVisible).sort((a, b) => a.order - b.order),
    [report]
  );
  
  const exportToCsv = () => {
    if (!data || !data.rows) return;
    
    // Create CSV content
    const headers = visibleFields.map(field => {
      const objectName = objectTypes?.find(obj => obj.id === field.objectTypeId)?.name || '';
      return `"${objectName}: ${field.displayName}"`;
    }).join(',');
    
    const rows = data.rows.map(row => 
      visibleFields.map(field => {
        const key = `${field.objectTypeId}_${field.fieldApiName}`;
        const value = row[key];
        // Ensure proper CSV escaping for strings
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium text-red-600">Error loading report data</h3>
            <p className="text-muted-foreground">{String(error)}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data || data.rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">No data found</h3>
            <p className="text-muted-foreground">
              This report doesn't contain any data matching your criteria.
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {data.totalCount} record{data.totalCount !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleFields.map((field, index) => (
                  <TableHead key={index}>
                    {field.displayName}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {visibleFields.map((field, colIndex) => {
                    const key = `${field.objectTypeId}_${field.fieldApiName}`;
                    const value = row[key];
                    
                    return (
                      <TableCell key={colIndex}>
                        {value !== undefined && value !== null 
                          ? String(value) 
                          : <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
