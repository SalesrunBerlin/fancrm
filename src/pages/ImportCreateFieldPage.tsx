
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ObjectFieldForm } from "@/components/settings/ObjectFieldForm";
import { useRecordFields } from "@/hooks/useRecordFields";
import { ObjectField } from "@/hooks/useObjectTypes";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ImportCreateFieldPage() {
  const { objectTypeId, columnName } = useParams<{ objectTypeId: string; columnName: string }>();
  const navigate = useNavigate();
  const { fields, isLoading } = useRecordFields(objectTypeId);
  const [decodedColumnName, setDecodedColumnName] = useState<string>("");
  const [suggestedType, setSuggestedType] = useState<string>("text");
  
  useEffect(() => {
    if (columnName) {
      // Decode the column name from URL
      const decoded = decodeURIComponent(columnName);
      setDecodedColumnName(decoded);
      
      // Suggest data type based on column name
      const lowerName = decoded.toLowerCase();
      
      if (lowerName.includes('date') || lowerName.includes('time')) {
        setSuggestedType('datetime');
      } else if (lowerName.includes('email')) {
        setSuggestedType('email');
      } else if (lowerName.includes('price') || lowerName.includes('cost') || lowerName.includes('amount')) {
        setSuggestedType('currency');
      } else if (lowerName.includes('url') || lowerName.includes('website') || lowerName.includes('link')) {
        setSuggestedType('url');
      } else if (lowerName.includes('description') || lowerName.includes('notes') || lowerName.includes('comment')) {
        setSuggestedType('textarea');
      } else if (lowerName.includes('count') || lowerName.includes('number') || lowerName.includes('amount')) {
        setSuggestedType('number');
      } else {
        setSuggestedType('text');
      }
    }
  }, [columnName]);
  
  const handleFieldCreated = (field: ObjectField) => {
    navigate(`/objects/${objectTypeId}/import?newFieldId=${field.id}&columnName=${columnName}`);
  };
  
  return (
    <div className="space-y-4">
      <PageHeader
        title={`Create Field: ${decodedColumnName}`}
        description="Create a new field for this column"
        actions={
          <Button variant="outline" onClick={() => navigate(`/objects/${objectTypeId}/import`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Import
          </Button>
        }
      />
      
      <Card>
        <CardContent className="pt-6">
          <ObjectFieldForm
            objectTypeId={objectTypeId!}
            initialName={decodedColumnName}
            defaultType={suggestedType}
            onComplete={handleFieldCreated}
          />
        </CardContent>
      </Card>
    </div>
  );
}
