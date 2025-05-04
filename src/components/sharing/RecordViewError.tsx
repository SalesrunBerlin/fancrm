
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface RecordViewErrorProps {
  message: string;
}

export function RecordViewError({ message }: RecordViewErrorProps) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button variant="outline" className="mt-4" asChild>
        <Link to="/shared-records">Back to Shared Records</Link>
      </Button>
    </div>
  );
}
