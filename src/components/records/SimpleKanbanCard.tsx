
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SimpleKanbanCardProps {
  record: any;
  onClick: () => void;
  onMove: (targetStatus: string) => void;
  currentStatus: string;
  availableStatuses: string[];
}

export function SimpleKanbanCard({ record, onClick, onMove, currentStatus, availableStatuses }: SimpleKanbanCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Get the name field or first field value for display
  const getDisplayName = () => {
    const nameField = record?.field_values?.name || record?.name;
    
    if (nameField) {
      return nameField;
    }
    
    // If no name field, get the first non-empty field value
    const firstValue = Object.values(record?.field_values || {}).find(val => val);
    return firstValue || `Record ${record.id.substring(0, 8)}`;
  };
  
  // Get the description field or second field value for display
  const getDescription = () => {
    const descField = record?.field_values?.description || record?.description;
    
    if (descField) {
      return descField;
    }
    
    // Get field keys and values
    const fields = record?.field_values || {};
    const fieldEntries = Object.entries(fields);
    
    // Skip the first entry (assumed to be the title) and get the next one
    if (fieldEntries.length > 1) {
      const [fieldName, fieldValue] = fieldEntries[1];
      if (fieldValue) {
        return `${fieldName}: ${fieldValue}`;
      }
    }
    
    return null;
  };

  const handleMoveClick = (e: React.MouseEvent, status: string) => {
    e.stopPropagation();
    onMove(status);
    setIsMenuOpen(false);
  };
  
  return (
    <Card 
      className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-medium truncate">
          {getDisplayName()}
        </CardTitle>
        {getDescription() && (
          <CardDescription className="text-xs truncate">
            {getDescription()}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">{record.id.substring(0, 8)}</span>
          
          {availableStatuses.length > 0 && (
            <div onClick={(e) => e.stopPropagation()}>
              <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 p-1 text-xs"
                  >
                    Move <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-0" align="end">
                  <div className="py-1">
                    {availableStatuses.map((status) => (
                      <Button
                        key={status}
                        variant="ghost"
                        className="w-full justify-start rounded-none h-7 text-xs"
                        onClick={(e) => handleMoveClick(e, status)}
                      >
                        {status || 'No Value'}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
