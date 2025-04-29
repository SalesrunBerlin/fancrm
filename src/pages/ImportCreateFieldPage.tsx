
import { useState } from "react";
import { useNavigate, Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ObjectFieldForm } from "@/components/settings/ObjectFieldForm";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { ObjectField } from "@/hooks/useObjectTypes";

export default function ImportCreateFieldPage() {
  const navigate = useNavigate();
  const { objectTypeId, columnName } = useParams<{ objectTypeId: string; columnName: string }>();
  const [searchParams] = useSearchParams();
  const { objectTypes } = useObjectTypes();
  
  // Get the current object type for display
  const currentObjectType = objectTypes?.find(obj => obj.id === objectTypeId);
  
  // Handle completion of field creation
  const handleComplete = (field: ObjectField) => {
    // Redirect back to the import page with the field information
    // We encode the field ID to be used for mapping
    navigate(`/objects/${objectTypeId}/import?newFieldId=${field.id}&columnName=${columnName}`);
  };

  if (!objectTypeId) {
    return <div>Invalid object type ID</div>;
  }

  const decodedColumnName = columnName ? decodeURIComponent(columnName) : "";

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Button variant="outline" asChild>
        <Link to={`/objects/${objectTypeId}/import`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Import
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Create New Field</h1>
          {currentObjectType && (
            <p className="text-muted-foreground">
              For object: {currentObjectType.name}
            </p>
          )}
          {decodedColumnName && (
            <p className="text-muted-foreground">
              From column: {decodedColumnName}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ObjectFieldForm 
            objectTypeId={objectTypeId} 
            initialName={decodedColumnName}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
