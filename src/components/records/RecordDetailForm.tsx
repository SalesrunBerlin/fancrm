import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useObjectTypes, ObjectField } from "@/hooks/useObjectTypes";
import { useEnhancedFields } from "@/hooks/useEnhancedFields";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Collapsible } from "@/components/ui/collapsible";
import { CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ViewField } from "./ViewField";
import { EditField } from "./EditField";
import { InlineFieldCreator } from "./InlineFieldCreator";

interface RecordDetailFormProps {
  objectTypeId: string;
  recordId: string;
  isEditMode: boolean;
  onSave: (record: any) => void;
  onCancel: () => void;
}

export function RecordDetailForm({
  objectTypeId,
  recordId,
  isEditMode,
  onSave,
  onCancel
}: RecordDetailFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { objectType, isLoading: isLoadingObjectType } = useObjectTypes(objectTypeId);
  const { fields, isLoading: isLoadingFields, refetch: refetchFields } = useEnhancedFields(objectTypeId);
  const { record, isLoading: isLoadingRecord, refetch: refetchRecord } = useRecordDetail(objectTypeId, recordId);
  const { updateRecord } = useObjectRecords(objectTypeId);
  const [recordValues, setRecordValues] = useState<any>({});

  // Populate initial values when record loads
  useEffect(() => {
    if (record) {
      setRecordValues(record.field_values);
    }
  }, [record]);

  const handleFieldChange = (fieldApiName: string, value: any) => {
    setRecordValues(prev => ({
      ...prev,
      [fieldApiName]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      // Update the record with field values
      await updateRecord.mutateAsync({
        recordId: recordId,
        field_values: recordValues
      });
      
      setIsSubmitting(false);
      toast.success("Record updated successfully");
      onSave(recordValues);
      refetchRecord(); // Refresh record data
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to update record. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  // Prepare sections
  const sections = React.useMemo(() => {
    if (!fields) return [];

    const sectionsMap: { [key: string]: { id: string, title: string, fields: ObjectField[] } } = {};

    fields.forEach(field => {
      const sectionId = field.section_id || 'default';
      if (!sectionsMap[sectionId]) {
        sectionsMap[sectionId] = {
          id: sectionId,
          title: field.section_name || '',
          fields: []
        };
      }
      sectionsMap[sectionId].fields.push(field);
    });

    return Object.values(sectionsMap);
  }, [fields]);

  return (
    <div className="p-6">
      {isLoading || isLoadingRecord ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header section with actions */}
          {isEditMode && (
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Edit Record</h3>
              <div className="flex items-center gap-2">
                <InlineFieldCreator 
                  objectTypeId={objectTypeId}
                  onFieldCreated={() => {
                    // Refresh fields when a new field is created
                    refetchFields();
                  }}
                />
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          )}
          
          {/* Fields */}
          <div className="grid gap-6">
            {sections.map((section) => (
              <div key={section.id || 'default'} className="space-y-4">
                {section.title && (
                  <h4 className="font-medium border-b pb-1">{section.title}</h4>
                )}
                
                <div className="grid gap-4">
                  {section.fields.map((field) => (
                    <div key={field.id} className="grid grid-cols-3 gap-4 items-start">
                      <div className="flex items-center">
                        <label 
                          htmlFor={field.api_name}
                          className={`text-sm font-medium ${field.is_required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}`}
                        >
                          {field.name}
                        </label>
                      </div>
                      
                      <div className="col-span-2">
                        {isEditMode ? (
                          <EditField 
                            field={field}
                            value={recordValues[field.api_name]}
                            onChange={(value) => handleFieldChange(field.api_name, value)}
                            objectTypeId={objectTypeId}
                          />
                        ) : (
                          <ViewField 
                            field={field}
                            value={recordValues[field.api_name]}
                            objectTypeId={objectTypeId}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* System fields section */}
          <Collapsible>
            <div className="flex items-center justify-between space-x-4 mb-2">
              <h4 className="text-sm font-medium">System Fields</h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Toggle system fields</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent>
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-3 gap-4 items-start">
                  <div className="flex items-center">
                    <Label htmlFor="created_at" className="text-sm font-medium">Created At</Label>
                  </div>
                  <div className="col-span-2">
                    <Input type="text" id="created_at" value={record?.created_at || ''} readOnly disabled className="cursor-not-allowed" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 items-start">
                  <div className="flex items-center">
                    <Label htmlFor="updated_at" className="text-sm font-medium">Updated At</Label>
                  </div>
                  <div className="col-span-2">
                    <Input type="text" id="updated_at" value={record?.updated_at || ''} readOnly disabled className="cursor-not-allowed" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 items-start">
                  <div className="flex items-center">
                    <Label htmlFor="record_id" className="text-sm font-medium">Record ID</Label>
                  </div>
                  <div className="col-span-2">
                    <Input type="text" id="record_id" value={record?.record_id || ''} readOnly disabled className="cursor-not-allowed" />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  field: ObjectField;
  value: any;
  objectTypeId: string;
  onChange?: (value: any) => void;
}

function EditField({ field, value, objectTypeId, onChange }: FieldProps) {
  return (
    <div>
      {/* Implement editable field based on field type */}
      <Input
        type="text"
        id={field.api_name}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

function ViewField({ field, value, objectTypeId }: FieldProps) {
  return (
    <div>
      {/* Implement viewable field based on field type */}
      <Input
        type="text"
        id={field.api_name}
        value={value || ''}
        readOnly
        disabled
        className="cursor-not-allowed"
      />
    </div>
  );
}
