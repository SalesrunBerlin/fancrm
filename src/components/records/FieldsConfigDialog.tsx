
import { useState, useEffect } from "react";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FieldsConfigDialogProps {
  objectTypeId: string;
  onVisibilityChange: (visibleFields: string[]) => void;
  defaultVisibleFields: string[];
}

export function FieldsConfigDialog({
  objectTypeId,
  onVisibilityChange,
  defaultVisibleFields,
}: FieldsConfigDialogProps) {
  const { fields } = useObjectFields(objectTypeId);
  const [visibleFields, setVisibleFields] = useState<string[]>(defaultVisibleFields);

  const handleFieldToggle = (fieldApiName: string, checked: boolean) => {
    setVisibleFields(prev => {
      const newVisibleFields = checked
        ? [...prev, fieldApiName]
        : prev.filter(f => f !== fieldApiName);
      onVisibilityChange(newVisibleFields);
      return newVisibleFields;
    });
  };

  useEffect(() => {
    setVisibleFields(defaultVisibleFields);
  }, [defaultVisibleFields]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">Configure columns</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Table Columns</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {fields?.map((field) => (
              <div key={field.api_name} className="flex items-center space-x-2">
                <Checkbox
                  id={field.api_name}
                  checked={visibleFields.includes(field.api_name)}
                  onCheckedChange={(checked) => 
                    handleFieldToggle(field.api_name, checked as boolean)
                  }
                />
                <Label htmlFor={field.api_name}>
                  {field.name}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
