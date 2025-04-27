
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CreateRecordDialog } from "@/components/records/CreateRecordDialog";
import { FieldsConfigDialog } from "@/components/records/FieldsConfigDialog";

export default function ObjectRecordsList() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const { records, isLoading } = useObjectRecords(objectTypeId);
  const { fields } = useObjectFields(objectTypeId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  // Load visible fields from localStorage or set defaults
  useEffect(() => {
    if (fields && objectTypeId) {
      const storedFields = localStorage.getItem(`visible-fields-${objectTypeId}`);
      const defaultFields = fields.map(f => f.api_name);
      const initialFields = storedFields ? JSON.parse(storedFields) : defaultFields;
      setVisibleFields(initialFields);
    }
  }, [fields, objectTypeId]);

  // Save visible fields to localStorage
  const handleVisibilityChange = (newVisibleFields: string[]) => {
    setVisibleFields(newVisibleFields);
    if (objectTypeId) {
      localStorage.setItem(`visible-fields-${objectTypeId}`, JSON.stringify(newVisibleFields));
    }
  };

  if (!objectType) {
    return <div>Object type not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{objectType.name}</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New {objectType.name}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Configuration button */}
                <TableHead className="w-10 p-0">
                  <FieldsConfigDialog
                    objectTypeId={objectTypeId}
                    onVisibilityChange={handleVisibilityChange}
                    defaultVisibleFields={visibleFields}
                  />
                </TableHead>
                {/* Visible field columns */}
                {fields?.filter(field => visibleFields.includes(field.api_name))
                  .map(field => (
                    <TableHead key={field.api_name}>{field.name}</TableHead>
                  ))}
                <TableHead>Created At</TableHead>
                <TableHead>Last Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell />
                  {fields?.filter(field => visibleFields.includes(field.api_name))
                    .map(field => (
                      <TableCell key={field.api_name}>
                        {record.field_values?.[field.api_name] || "-"}
                      </TableCell>
                    ))}
                  <TableCell>{formatDate(record.created_at)}</TableCell>
                  <TableCell>{formatDate(record.updated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateRecordDialog
        objectTypeId={objectTypeId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
