
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

export interface PreviewImportDataProps {
  file: File | null;
  onPreview: (data: any[]) => void;
  onBack: () => void;
}

export function PreviewImportData({ file, onPreview, onBack }: PreviewImportDataProps) {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        if (!csvContent) {
          setError("Failed to read file content");
          setIsLoading(false);
          return;
        }
        
        const rows = csvContent.split('\n');
        if (rows.length === 0) {
          setError("The CSV file appears to be empty");
          setIsLoading(false);
          return;
        }
        
        // Detect delimiter (comma or tab)
        const firstRow = rows[0];
        const delimiter = firstRow.includes('\t') ? '\t' : ',';
        
        // Parse headers
        const headerRow = rows[0].split(delimiter);
        setHeaders(headerRow.map(h => h.trim()));
        
        // Parse the actual data (limited to first 10 rows for preview)
        const data = [];
        const maxRows = Math.min(rows.length, 11); // Headers + 10 data rows
        
        for (let i = 1; i < maxRows; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const rowData = rows[i].split(delimiter);
          const rowObject: {[key: string]: string} = {};
          
          headerRow.forEach((header, index) => {
            rowObject[header.trim()] = rowData[index] ? rowData[index].trim() : '';
          });
          
          data.push(rowObject);
        }
        
        setPreviewData(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error parsing CSV:", err);
        setError("Failed to parse the CSV file. Please make sure it's a valid CSV format.");
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError("Failed to read the file");
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  }, [file]);

  const handleContinue = () => {
    onPreview(previewData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Import Data</CardTitle>
        <CardDescription>
          Review the data before proceeding with the import.
          Showing up to 10 rows for preview.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading preview...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            <p>{error}</p>
            <Button variant="outline" onClick={onBack} className="mt-2">
              Go Back
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header, colIndex) => (
                        <TableCell key={colIndex}>{row[header]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={onBack}>Back</Button>
              <Button onClick={handleContinue}>Continue</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
