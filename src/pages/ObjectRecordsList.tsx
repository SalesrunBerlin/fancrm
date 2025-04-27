import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Save, X, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CreateRecordDialog } from "@/components/records/CreateRecordDialog";
import { FieldsConfigDialog } from "@/components/records/FieldsConfigDialog";
import { EditableCell } from "@/components/records/EditableCell";
import { ObjectRecordsFilter } from "@/components/records/ObjectRecordsFilter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ObjectRecordsList() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { objectTypes } = useObjectTypes();
  const { records, isLoading, updateRecord } = useObjectRecords(objectTypeId);
  const { fields } = useObjectFields(objectTypeId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editedRecords, setEditedRecords] = useState<Record<string, Record<string, any>>>({});
  const [showFilters, setShowFilters] = useState(false);
  
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

  // Handle field value change
  const handleFieldChange = (recordId: string, fieldApiName: string, value: any) => {
    setEditedRecords(prev => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || {}),
        [fieldApiName]: value
      }
    }));
  };

  // Check if a record has been edited
  const isRecordEdited = (recordId: string) => {
    return editedRecords[recordId] && Object.keys(editedRecords[recordId]).length > 0;
  };

  // Save edited record
  const saveRecord = async (recordId: string) => {
    if (editedRecords[recordId]) {
      await updateRecord.mutateAsync({
        id: recordId,
        field_values: editedRecords[recordId]
      });
      
      // Clear edited values for this record after save
      setEditedRecords(prev => {
        const newState = { ...prev };
        delete newState[recordId];
        return newState;
      });
    }
  };

  // Cancel editing for a record
  const cancelEditing = (recordId: string) => {
    setEditedRecords(prev => {
      const newState = { ...prev };
      delete newState[recordId];
      return newState;
    });
  };

  // Toggle edit mode for all records
  const toggleEditMode = () => {
    if (editMode && Object.keys(editedRecords).length > 0) {
      // If turning off edit mode with unsaved changes, clear them
      setEditedRecords({});
    }
    setEditMode(!editMode);
  };

  // Navigate to record detail page
  const handleRowClick = (recordId: string) => {
    if (!editMode) {
      navigate(`/objects/${objectTypeId}/${recordId}`);
    }
  };

  if (!objectType) {
    return <div>Object type not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{objectType.name}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEditMode}
            className={editMode ? "bg-amber-100" : ""}
          >
            <Edit className="h-4 w-4 mr-1" />
            {editMode ? "Exit Edit Mode" : "Edit Mode"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className={showFilters ? "bg-blue-100" : ""}>
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New {objectType.name}
          </Button>
        </div>
      </div>

      <Collapsible open={showFilters} className="w-full">
        <CollapsibleContent className="space-y-2">
          <Card className="mb-4">
            <CardContent className="pt-6">
              <ObjectRecordsFilter 
                objectTypeId={objectTypeId} 
                fields={fields || []} 
              />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

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
                {editMode && <TableHead className="w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records?.map((record) => (
                <TableRow 
                  key={record.id} 
                  className={!editMode ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={!editMode ? () => handleRowClick(record.id) : undefined}
                >
                  <TableCell className="p-0 w-10">
                    {/* Empty cell for alignment, clicking handled at row level */}
                  </TableCell>
                  {fields?.filter(field => visibleFields.includes(field.api_name))
                    .map(field => (
                      <EditableCell
                        key={`${record.id}-${field.api_name}`}
                        value={record.field_values?.[field.api_name]}
                        editMode={editMode}
                        onChange={(value) => handleFieldChange(record.id, field.api_name, value)}
                        fieldType={field.data_type}
                        isRequired={field.is_required}
                      />
                    ))}
                  <TableCell>{formatDate(record.created_at)}</TableCell>
                  <TableCell>{formatDate(record.updated_at)}</TableCell>
                  {editMode && (
                    <TableCell className="w-24">
                      {isRecordEdited(record.id) ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveRecord(record.id);
                            }}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditing(record.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  )}
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
