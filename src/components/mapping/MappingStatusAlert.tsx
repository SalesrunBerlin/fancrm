
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
    <div className="p-6 space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden der Daten</AlertTitle>
        <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
      </Alert>
      <div className="flex flex-col">
        <p className="text-muted-foreground mb-4">
          Möglicherweise wurde der Datensatz gelöscht oder die Freigabe wurde zurückgezogen.
          Sie können zu Ihren Freigaben zurückkehren und es erneut versuchen.
        </p>
        <Button onClick={onGoBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Freigaben
        </Button>
      </div>
    </div>
  );
}
