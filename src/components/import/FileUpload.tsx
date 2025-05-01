
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate if it's a CSV file
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        setError("Please select a CSV file.");
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    } else {
      setError("Please select a file first.");
    }
  }, [selectedFile, onFileUpload]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
        <CardDescription>
          Select a CSV file containing the records you want to import
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">
                Choose a CSV file
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">CSV files only</p>
            </div>
            {selectedFile && (
              <div className="mt-4 text-sm">
                <span className="font-medium">Selected file:</span> {selectedFile.name}
              </div>
            )}
            {error && (
              <div className="mt-2 text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!selectedFile}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
