import React, { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useObjectFields } from '@/hooks/useObjectFields';
import { useFieldPicklistValues } from '@/hooks/useFieldPicklistValues';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useObjectRecords } from '@/hooks/useObjectRecords';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleKanbanCard } from './SimpleKanbanCard';

interface KanbanViewProps {
  objectTypeId: string;
  records: any[];
  isLoading: boolean;
  onRecordClick?: (id: string) => void;
}

export function KanbanView({ objectTypeId, records, isLoading, onRecordClick }: KanbanViewProps) {
  const navigate = useNavigate();
  const { fields } = useObjectFields(objectTypeId);
  const { updateRecord } = useObjectRecords(objectTypeId);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Find all picklist fields that can be used for kanban view
  const picklistFields = useMemo(() => {
    return fields?.filter(field => field.data_type === 'picklist') || [];
  }, [fields]);
  
  useEffect(() => {
    // Set the first picklist field as default if none selected
    if (!selectedField && picklistFields.length > 0) {
      setSelectedField(picklistFields[0].api_name);
    }
  }, [picklistFields, selectedField]);

  // Get picklist values for the selected field
  const { picklistValues, isLoading: isLoadingPicklist } = useFieldPicklistValues(
    selectedField || ''
  );

  // Group records by picklist value
  const groupedRecords = useMemo(() => {
    if (!records || !selectedField) return {};
    
    const groups: Record<string, any[]> = {};
    
    // Initialize groups for all picklist values
    if (picklistValues) {
      picklistValues.forEach(value => {
        groups[value.value] = [];
      });
    }
    
    // Add a group for empty values
    groups[''] = [];
    
    // Group records
    records.forEach(record => {
      const fieldValue = record.field_values?.[selectedField] || '';
      if (groups[fieldValue] !== undefined) {
        groups[fieldValue].push(record);
      } else {
        // If value doesn't match any picklist value, add to empty group
        groups[''].push(record);
      }
    });
    
    return groups;
  }, [records, selectedField, picklistValues]);

  const handleRecordClick = (recordId: string) => {
    if (onRecordClick) {
      onRecordClick(recordId);
    } else {
      // Use React Router navigation
      navigate(`/objects/${objectTypeId}/records/${recordId}`);
    }
  };

  const handleMoveRecord = async (recordId: string, targetStatus: string) => {
    if (!selectedField) return;
    
    setIsUpdating(true);
    try {
      await updateRecord.mutateAsync({
        id: recordId,
        field_values: {
          [selectedField]: targetStatus
        }
      });
      toast.success("Record moved successfully");
    } catch (error) {
      console.error("Error moving record:", error);
      toast.error("Failed to move record");
    } finally {
      setIsUpdating(false);
    }
  };

  // Display loading state
  if (isLoading || isLoadingPicklist) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if we have a selected field and picklist values
  if (!selectedField) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No picklist fields available for Kanban view</p>
      </div>
    );
  }

  const fieldName = fields?.find(f => f.api_name === selectedField)?.name || selectedField;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">Grouped by: {fieldName}</h3>
        
        {picklistFields.length > 1 && (
          <select 
            className="border p-1 rounded text-sm"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            {picklistFields.map(field => (
              <option key={field.api_name} value={field.api_name}>
                {field.name}
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex space-x-4 p-4 min-w-max">
          {picklistValues?.map((value, index) => (
            <div
              key={value.id || index}
              className="bg-card w-72 rounded-lg shadow flex flex-col"
            >
              <div 
                className="p-3 font-medium border-b flex justify-between items-center"
                style={{ backgroundColor: `${value.color || '#f5f5f5'}20` }}
              >
                <span>{value.value || 'No Value'}</span>
                <span className="text-muted-foreground text-sm">
                  {groupedRecords[value.value]?.length || 0}
                </span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
                {groupedRecords[value.value]?.map((record) => (
                  <SimpleKanbanCard
                    key={record.id}
                    record={record}
                    onClick={() => handleRecordClick(record.id)}
                    onMove={(targetStatus) => handleMoveRecord(record.id, targetStatus)}
                    currentStatus={value.value}
                    availableStatuses={picklistValues?.filter(v => v.value !== value.value).map(v => v.value) || []}
                  />
                ))}
                {groupedRecords[value.value]?.length === 0 && (
                  <p className="text-center text-muted-foreground p-4">No records</p>
                )}
              </div>
            </div>
          ))}
          {!picklistValues || picklistValues.length === 0 ? (
            <div className="p-4 text-center w-full">
              <p className="text-muted-foreground">No picklist values found for this field</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
