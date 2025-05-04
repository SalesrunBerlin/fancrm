
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Settings } from 'lucide-react';

interface RecordViewErrorProps {
  message: string;
}

export function RecordViewError({ message }: RecordViewErrorProps) {
  // Check if the error is related to missing field mappings
  const isMappingError = message.includes('Feldzuordnung') || 
                         message.includes('mapping') || 
                         message.includes('Keine Feldzuordnungen gefunden');
                         
  return (
    <div className="p-4 space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler</AlertTitle>
        <AlertDescription className="whitespace-pre-wrap">{message}</AlertDescription>
      </Alert>
      
      {isMappingError ? (
        <div className="space-y-4">
          <p className="text-sm">
            Um einen geteilten Datensatz anzuzeigen, müssen Sie zuerst die Felder dem entsprechenden Objekt in Ihrem System zuordnen.
            Bitte klicken Sie auf den Button unten, um zur Feldzuordnung zu gelangen.
          </p>
          <div className="flex gap-2">
            <Button variant="default" asChild>
              <Link to="/shared-records">
                <Settings className="mr-2 h-4 w-4" />
                Zu Freigaben und Feldzuordnung
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/shared-records">Zurück zu Freigaben</Link>
        </Button>
      )}
    </div>
  );
}
