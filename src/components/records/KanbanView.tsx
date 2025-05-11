
import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, MoveHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { KanbanCard } from './KanbanCard';
import { useKanbanViewSettings } from '@/hooks/useKanbanViewSettings';
import { useObjectFields } from '@/hooks/useObjectFields';
import { useFieldPicklistValues } from '@/hooks/useFieldPicklistValues';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { MoveToButton } from './MoveToButton';
import { useObjectRecords } from '@/hooks/useObjectRecords';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button'; // Add this import!

export interface PicklistValue {
  id: string;
  value: string;
  label?: string;
  color?: string; // Make color optional since it might not exist in the database
  order?: number;
}

interface KanbanViewProps {
  objectTypeId: string;
  records: any[];
  isLoading: boolean;
  onRecordClick?: (id: string) => void;
}

export function KanbanView({ objectTypeId, records, isLoading, onRecordClick }: KanbanViewProps) {
  const navigate = useNavigate();
  const { settings, updateFieldApiName, isColumnExpanded, toggleColumnExpansion } = useKanbanViewSettings(objectTypeId);
  const { fields } = useObjectFields(objectTypeId);
  const [selectedField, setSelectedField] = useState<string | null>(settings?.fieldApiName || null);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const { updateRecord } = useObjectRecords(objectTypeId);
  
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
      const fieldValue = record.field_values?.[selectedField] || '';
      if (groups[fieldValue]) {
        groups[fieldValue].push(record);
      } else {
        // If value doesn't match any picklist value, add to empty group
        groups[''].push(record);
      }
    });
    
    return groups;
  }, [records, selectedField, picklistValues]);

  const handleRecordClick = (recordId: string, event?: React.MouseEvent) => {
    if (event?.shiftKey || event?.ctrlKey || event?.metaKey) {
      // Toggle record selection
      setSelectedRecords(prev => {
        if (prev.includes(recordId)) {
          return prev.filter(id => id !== recordId);
        } else {
          return [...prev, recordId];
        }
      });
    } else if (onRecordClick) {
      onRecordClick(recordId);
    } else {
      // Use React Router navigation
      navigate(`/objects/${objectTypeId}/records/${recordId}`);
    }
  };

  const handleRecordSelect = (recordId: string, isSelected: boolean) => {
    setSelectedRecords(prev => {
      if (isSelected) {
        if (!prev.includes(recordId)) {
          return [...prev, recordId];
        }
      } else {
        return prev.filter(id => id !== recordId);
      }
      return prev;
    });
  };

  const handleBatchMove = async (recordIds: string[], targetStatus: string) => {
    if (!selectedField) return;

    try {
      // Update each record sequentially
      for (const recordId of recordIds) {
        await updateRecord.mutateAsync({
          id: recordId,
          field_values: {
            [selectedField]: targetStatus
          }
        });
      }

      // Clear selection after successful moves
      setSelectedRecords([]);

    } catch (error) {
      console.error("Error moving records:", error);
      throw error;
    }
  };

  if (isLoading || isLoadingPicklist) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Generate default colors for kanban columns if not provided
  const getColumnBackgroundColor = (value: PicklistValue, index: number) => {
    if (value.color) {
      return `${value.color}20`; // Use the color with 20% opacity if it exists
    }
    
    // Default color palette for columns without colors
    const defaultColors = [
      '#E5DEFF', '#D3E4FD', '#F2FCE2', '#FEF7CD', '#FFDEE2', '#FDE1D3'
    ];
    
    return `${defaultColors[index % defaultColors.length]}`;
  };

  return (
    <div className="w-full">
      {selectedRecords.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 rounded-md">
          <span className="text-sm font-medium">
            {selectedRecords.length} record{selectedRecords.length > 1 ? 's' : ''} selected
          </span>
          <MoveToButton 
            selectedRecords={selectedRecords}
            picklistValues={picklistValues || []}
            onMoveRecords={handleBatchMove}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedRecords([])}
          >
            Clear selection
          </Button>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <div className="flex space-x-4 p-4 min-w-max">
          {picklistValues?.map((value, index) => (
            <div
              key={value.id}
              className="bg-card w-72 rounded-lg shadow flex flex-col"
            >
              <div 
                className="p-3 font-medium border-b flex justify-between items-center"
                style={{ backgroundColor: getColumnBackgroundColor(value, index) }}
              >
                <span>{value.value || 'No Value'}</span>
                <span className="text-muted-foreground text-sm">
                  {groupedRecords[value.value]?.length || 0}
                </span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
                {groupedRecords[value.value]?.map((record) => (
                  <div key={record.id} className="relative">
                    <div 
                      className="absolute left-1 top-3 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecordSelect(record.id, !selectedRecords.includes(record.id));
                      }}
                    >
                      <Checkbox 
                        checked={selectedRecords.includes(record.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <KanbanCard
                      record={record}
                      objectTypeId={objectTypeId}
                      onClick={(id) => handleRecordClick(id)}
                      isSelected={selectedRecords.includes(record.id)}
                    />
                  </div>
                ))}
                {groupedRecords[value.value]?.length === 0 && (
                  <p className="text-center text-muted-foreground p-4">No records</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
