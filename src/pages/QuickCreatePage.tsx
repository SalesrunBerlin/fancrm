
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObjectTypeSelector } from "@/components/quick-create/ObjectTypeSelector";
import { QuickCreateList } from "@/components/quick-create/QuickCreateList";
import { useObjectType } from "@/hooks/useObjectType";
import { useObjectFields } from "@/hooks/useObjectFields";

export default function QuickCreatePage() {
  const [selectedObjectTypeId, setSelectedObjectTypeId] = useState<string>();
  const [nameFieldApiName, setNameFieldApiName] = useState<string>("name");
  
  const { objectType } = useObjectType(selectedObjectTypeId || "");
  const { fields } = useObjectFields(selectedObjectTypeId);
  
  // Determine the name field when fields change
  useEffect(() => {
    if (fields.length > 0) {
      // Try to find a field named "name", "title", or take the first text field
      const nameField = 
        fields.find(f => f.api_name.toLowerCase() === "name") ||
        fields.find(f => f.api_name.toLowerCase() === "title") ||
        fields.find(f => f.data_type === "text");
      
      if (nameField) {
        setNameFieldApiName(nameField.api_name);
      }
    }
  }, [fields]);
  
  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Quick Create"
        description="Quickly create records with minimal input"
      />
      
      <div className="mb-6">
        <ObjectTypeSelector value={selectedObjectTypeId} onChange={setSelectedObjectTypeId} />
      </div>
      
      {selectedObjectTypeId && (
        <Card>
          <CardHeader>
            <CardTitle>{objectType?.name || "Items"} Quick List</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickCreateList 
              objectTypeId={selectedObjectTypeId}
              nameFieldApiName={nameFieldApiName}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
