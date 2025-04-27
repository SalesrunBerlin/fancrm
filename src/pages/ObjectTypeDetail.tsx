
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, User, Building, Briefcase, Calendar } from "lucide-react";
import { ObjectFieldsList } from "@/components/settings/ObjectFieldsList";
import { ObjectFieldForm } from "@/components/settings/ObjectFieldForm";

export default function ObjectTypeDetail() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes, isLoading: isLoadingTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const [showFieldForm, setShowFieldForm] = useState(false);

  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Building className="h-5 w-5" />;
    }
  };

  if (isLoadingTypes) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!objectType) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link to="/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Object type not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {getIconComponent(objectType.icon)}
          {objectType.name}
        </h1>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Fields</CardTitle>
          <Button onClick={() => setShowFieldForm(!showFieldForm)}>
            {showFieldForm ? 'Cancel' : 'Add Field'}
          </Button>
        </CardHeader>
        <CardContent>
          {showFieldForm && (
            <div className="mb-6 border rounded-lg p-4 bg-background/50">
              <ObjectFieldForm 
                objectTypeId={objectTypeId!} 
                onComplete={() => setShowFieldForm(false)}
              />
            </div>
          )}
          <ObjectFieldsList 
            fields={fields || []} 
            isLoading={isLoadingFields} 
            objectTypeId={objectTypeId!} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
