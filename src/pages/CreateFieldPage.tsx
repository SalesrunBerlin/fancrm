
import { useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ObjectFieldForm } from "@/components/settings/ObjectFieldForm";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { ObjectField } from "@/hooks/useObjectTypes";

export default function CreateFieldPage() {
  const navigate = useNavigate();
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  
  // Get the current object type for display
  const currentObjectType = objectTypes?.find(obj => obj.id === objectTypeId);

  const handleComplete = (field: ObjectField) => {
    navigate(`/settings/objects/${objectTypeId}`);
  };

  if (!objectTypeId) {
    return <div>Invalid object type ID</div>;
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Button variant="outline" asChild>
        <Link to={`/settings/objects/${objectTypeId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {currentObjectType?.name || 'Object'}
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
        </CardHeader>
        <CardContent>
          <ObjectFieldForm 
            objectTypeId={objectTypeId} 
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
