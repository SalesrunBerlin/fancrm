
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ObjectField } from "@/types/ObjectFieldTypes";

interface KanbanFieldsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fields: ObjectField[];
  selectedFields: string[];
  onSave: (fields: string[]) => void;
}

export function KanbanFieldsDialog({
  isOpen,
  onOpenChange,
  fields,
  selectedFields,
  onSave
}: KanbanFieldsDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);

  // Initialize selected fields when dialog opens
  useEffect(() => {
    setSelected(selectedFields || []);
  }, [selectedFields, isOpen]);

  const handleToggleField = (fieldApiName: string) => {
    setSelected(prev => {
      if (prev.includes(fieldApiName)) {
        return prev.filter(f => f !== fieldApiName);
      } else {
        return [...prev, fieldApiName];
      }
    });
  };

  const handleSave = () => {
    onSave(selected);
    onOpenChange(false);
  };

  // Filter out system fields and some technical fields
  const displayableFields = fields.filter(field => {
    // Skip fields like id, created_at, etc.
    const technicalFields = ['id', 'created_at', 'updated_at', 'owner_id', 'object_type_id'];
    return !technicalFields.includes(field.api_name) && !field.is_system;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Card Fields</DialogTitle>
          <DialogDescription>
            Select fields to display on Kanban cards
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {displayableFields.map((field) => (
              <div key={field.api_name} className="flex items-center space-x-2">
                <Checkbox
                  id={`field-${field.api_name}`}
                  checked={selected.includes(field.api_name)}
                  onCheckedChange={() => handleToggleField(field.api_name)}
                />
                <label
                  htmlFor={`field-${field.api_name}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {field.name}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
