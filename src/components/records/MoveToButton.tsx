
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { PicklistValue } from './KanbanView';
import { toast } from 'sonner';

interface MoveToButtonProps {
  selectedRecords: string[];
  picklistValues: PicklistValue[];
  onMoveRecords: (recordIds: string[], targetStatus: string) => Promise<void>;
}

export function MoveToButton({ selectedRecords, picklistValues, onMoveRecords }: MoveToButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMove = async (targetStatus: string) => {
    if (selectedRecords.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onMoveRecords(selectedRecords, targetStatus);
      toast.success(`${selectedRecords.length} record(s) moved successfully`);
      setIsOpen(false);
    } catch (error) {
      console.error("Error moving records:", error);
      toast.error("Failed to move records");
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedRecords.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-1"
          disabled={isProcessing}
        >
          <span>Move To...</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="py-1">
          {picklistValues.map((value) => (
            <Button
              key={value.id}
              variant="ghost"
              className="w-full justify-start rounded-none h-9 px-2"
              onClick={() => handleMove(value.value)}
              disabled={isProcessing}
            >
              {value.value || 'No Value'}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
