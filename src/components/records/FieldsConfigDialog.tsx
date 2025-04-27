
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
import { Separator } from "@/components/ui/separator";

interface FieldsConfigDialogProps {
  objectTypeId: string;
  onVisibilityChange: (visibleFields: string[]) => void;
  defaultVisibleFields: string[];
}

const systemFields = [
  { api_name: "created_at", name: "Created At", is_required: true, is_system: true },
  { api_name: "updated_at", name: "Last Modified", is_required: true, is_system: true },
  { api_name: "record_id", name: "Record ID", is_required: true, is_system: true },
];

export function FieldsConfigDialog({
  objectTypeId,
  onVisibilityChange,
  defaultVisibleFields,
}: FieldsConfigDialogProps) {
  const { fields } = useObjectFields(objectTypeId);
  const [visibleFields, setVisibleFields] = useState<string[]>(defaultVisibleFields);
  const allFields = [...(fields || []), ...systemFields];
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    setVisibleFields(defaultVisibleFields);
    setSelectAll(defaultVisibleFields.length === allFields.length);
  }, [defaultVisibleFields, allFields.length]);

  const handleSelectAll = (checked: boolean) => {
    const newVisibleFields = checked ? allFields.map(f => f.api_name) : [];
    setSelectAll(checked);
    setVisibleFields(newVisibleFields);
    onVisibilityChange(newVisibleFields);
  };

  const handleFieldToggle = (fieldApiName: string, checked: boolean) => {
    setVisibleFields(prev => {
      const newVisibleFields = checked
        ? [...prev, fieldApiName]
        : prev.filter(f => f !== fieldApiName);
      setSelectAll(newVisibleFields.length === allFields.length);
      onVisibilityChange(newVisibleFields);
      return newVisibleFields;
    });
  };

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
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={checked => handleSelectAll(checked as boolean)}
              />
              <Label htmlFor="select-all" className="font-medium">Select All Fields</Label>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-muted-foreground">Custom Fields</Label>
              {fields?.map((field) => (
                <div key={field.api_name} className="flex items-center space-x-2 pl-2">
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

              <Separator className="my-4" />
              
              <Label className="text-sm font-semibold text-muted-foreground">System Fields</Label>
              {systemFields.map((field) => (
                <div key={field.api_name} className="flex items-center space-x-2 pl-2">
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
