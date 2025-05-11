
import React, { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { KanbanCard } from './KanbanCard';
import { useKanbanViewSettings } from '@/hooks/useKanbanViewSettings';
import { useObjectFields } from '@/hooks/useObjectFields';
import { useFieldPicklistValues } from '@/hooks/useFieldPicklistValues';
import { Skeleton } from '@/components/ui/skeleton';

interface PicklistValue {
  id: string;
  value: string;
  label?: string;
  color?: string;
  order?: number;
}

interface KanbanViewProps {
  objectTypeId: string;
  records: any[];
  isLoading: boolean;
  onRecordClick?: (id: string) => void;
}

export function KanbanView({ objectTypeId, records, isLoading, onRecordClick }: KanbanViewProps) {
  const { settings, updateFieldApiName, isColumnExpanded, toggleColumnExpansion } = useKanbanViewSettings(objectTypeId);
  const { fields } = useObjectFields(objectTypeId);
  const [selectedField, setSelectedField] = useState<string | null>(settings?.fieldApiName || null);
  
  // Find all picklist fields that can be used for kanban view
  const picklistFields = useMemo(() => {
    return fields?.filter(field => field.data_type === 'picklist') || [];
  }, [fields]);
  
  useEffect(() => {
    // Set the first picklist field as default if none selected
    if (!selectedField && picklistFields.length > 0) {
      const defaultField = picklistFields[0].api_name;
      setSelectedField(defaultField);
      updateFieldApiName(defaultField);
    }
  }, [picklistFields, selectedField, updateFieldApiName]);

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
      const fieldValue = record.fields?.[selectedField] || '';
      if (groups[fieldValue]) {
        groups[fieldValue].push(record);
      } else {
        // If value doesn't match any picklist value, add to empty group
        groups[''].push(record);
      }
    });
    
    return groups;
  }, [records, selectedField, picklistValues]);

  if (isLoading || isLoadingPicklist) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex space-x-4 p-4 min-w-max">
        {picklistValues?.map((value) => (
          <div
            key={value.id}
            className="bg-card w-72 rounded-lg shadow flex flex-col"
          >
            <div 
              className="p-3 font-medium border-b flex justify-between items-center"
              style={{ backgroundColor: value.color ? `${value.color}20` : undefined }}
            >
              <span>{value.value || 'No Value'}</span>
              <span className="text-muted-foreground text-sm">
                {groupedRecords[value.value]?.length || 0}
              </span>
            </div>
            <div className="p-2 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              {groupedRecords[value.value]?.map((record) => (
                <KanbanCard
                  key={record.id}
                  record={record}
                  objectTypeId={objectTypeId}
                  onClick={onRecordClick}
                />
              ))}
              {groupedRecords[value.value]?.length === 0 && (
                <p className="text-center text-muted-foreground p-4">No records</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
