
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface MappingStatusAlertProps {
  error: string;
  onGoBack: () => void;
}

export function MappingStatusAlert({ error, onGoBack }: MappingStatusAlertProps) {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <Button onClick={onGoBack} variant="outline" className="mt-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Shared Records
      </Button>
    </div>
  );
}
