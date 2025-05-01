
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from 'react-router-dom';
import { useObjectFields } from '@/hooks/useObjectFields';
import { ObjectFieldForm } from '@/components/settings/ObjectFieldForm';
import { PageHeader } from '@/components/ui/page-header';

const ImportCreateFieldPage = () => {
  const { objectTypeId, columnName } = useParams<{ objectTypeId: string, columnName: string }>();
  const navigate = useNavigate();
  const { createField } = useObjectFields(objectTypeId || '');
  const [isCreating, setIsCreating] = useState(false);

  // Use the column name from URL as initial field name
  const decodedColumnName = columnName ? decodeURIComponent(columnName) : '';
  
  const handleCreateField = async (fieldData: any) => {
    setIsCreating(true);
    try {
      await createField(fieldData);
      // Navigate back to the import page after successful creation
      navigate(`/objects/${objectTypeId}/import`);
    } catch (error) {
      console.error("Error creating field:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    navigate(`/objects/${objectTypeId}/import`);
  };

  if (!objectTypeId || !columnName) {
    return <div>Missing required parameters</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader
        title="Create New Field"
        subtitle={`Creating field based on column: ${decodedColumnName}`}
      />

      <Card className="p-6">
        <ObjectFieldForm 
          initialValues={{
            name: decodedColumnName,
            api_name: decodedColumnName.toLowerCase().replace(/\s+/g, '_'),
            type: 'text',
            required: false,
            unique: false
          }}
          onSubmit={handleCreateField}
          isSubmitting={isCreating}
          objectTypeId={objectTypeId}
        />

        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ImportCreateFieldPage;
