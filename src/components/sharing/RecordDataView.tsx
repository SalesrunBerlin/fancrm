
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface RecordDataViewProps {
  objectTypeName: string;
  sharedByUserName: string;
  fields: {
    id: string;
    name: string;
    api_name: string;
  }[];
  transformedData: Record<string, string>;
}

export function RecordDataView({ objectTypeName, sharedByUserName, fields, transformedData }: RecordDataViewProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">{objectTypeName}</h2>
        <p className="text-muted-foreground">
          Shared by {sharedByUserName}
        </p>
      </CardHeader>
      <CardContent>
        {fields?.length > 0 && Object.keys(transformedData).length > 0 ? (
          <div className="space-y-6">
            {fields
              .filter(field => Object.keys(transformedData).includes(field.api_name))
              .map(field => (
                <div key={field.id} className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                  <div className="font-medium">{field.name}</div>
                  <div className="lg:col-span-2">
                    <div className="p-2 border rounded bg-gray-50">
                      {transformedData[field.api_name] || ''}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-center py-4">No mapped fields to display.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="outline" asChild>
          <Link to="/shared-records">Back to Shared Records</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
