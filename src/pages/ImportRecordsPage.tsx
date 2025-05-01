
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldMapperWithCreation } from '@/components/import/FieldMapperWithCreation';
import { useObjectFields } from '@/hooks/useObjectFields';
import { ObjectField } from '@/hooks/useObjectTypes';

const ImportRecordsPage = () => {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { fields } = useObjectFields(objectTypeId || '');
  
  // Sample data for demonstration
  const [columnMappings, setColumnMappings] = useState([
    { sourceColumnIndex: 0, sourceColumnName: 'Name', targetField: null },
    { sourceColumnIndex: 1, sourceColumnName: 'Email', targetField: null },
    { sourceColumnIndex: 2, sourceColumnName: 'Phone', targetField: null }
  ]);

  const handleUpdateMapping = (columnIndex: number, fieldId: string | null) => {
    const newMappings = [...columnMappings];
    
    if (fieldId) {
      const targetField = fields.find(field => field.id === fieldId) || null;
      newMappings[columnIndex] = {
        ...newMappings[columnIndex],
        targetField: targetField as ObjectField
      };
    } else {
      newMappings[columnIndex] = {
        ...newMappings[columnIndex],
        targetField: null
      };
    }
    
    setColumnMappings(newMappings);
  };
  
  if (!objectTypeId) {
    return <div>Missing object type ID</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="Import Records"
        subtitle={`Map CSV columns to fields for importing data`}
      />
      
      <Tabs defaultValue="mapping">
        <TabsList>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="mapping">Map Fields</TabsTrigger>
          <TabsTrigger value="preview">Review & Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="p-4">
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-4">Upload CSV File</h2>
            <p className="text-muted-foreground mb-4">
              Select a CSV file to begin the import process.
            </p>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="fileDropzone"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV files only</p>
                </div>
                <input id="fileDropzone" type="file" className="hidden" accept=".csv" />
              </label>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="mapping" className="p-4">
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-4">Map Columns to Fields</h2>
            <p className="text-muted-foreground mb-4">
              Associate each column from your CSV with a field in your object.
            </p>
            
            <FieldMapperWithCreation
              objectTypeId={objectTypeId}
              columnMappings={columnMappings}
              fields={fields}
              onUpdateMapping={handleUpdateMapping}
            />
            
            <div className="flex justify-end mt-8 gap-4">
              <Button variant="outline">Back</Button>
              <Button>Continue to Review</Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="p-4">
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-4">Review & Import</h2>
            <p className="text-muted-foreground mb-4">
              Review your data before importing.
            </p>
            
            <div className="flex justify-end mt-8 gap-4">
              <Button variant="outline">Back</Button>
              <Button>Import Data</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportRecordsPage;
