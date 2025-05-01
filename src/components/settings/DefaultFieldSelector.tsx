
import React, { useState } from "react";
import { ObjectField, ObjectType } from "@/hooks/useObjectTypes";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface DefaultFieldSelectorProps {
  objectType: ObjectType;
  fields: ObjectField[];
  onUpdateDefaultField: (fieldApiName: string) => Promise<void>;
}

export function DefaultFieldSelector({ objectType, fields, onUpdateDefaultField }: DefaultFieldSelectorProps) {
  const [selectedField, setSelectedField] = useState<string>(objectType.default_field_api_name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Filter only text fields that can be used as display fields
  const eligibleFields = fields.filter(field => 
    ["text", "email", "phone", "url", "textarea"].includes(field.data_type)
  );
  
  const handleSaveDefaultField = async () => {
    if (!selectedField) return;
    
    try {
      setIsUpdating(true);
      await onUpdateDefaultField(selectedField);
      toast.success("Default display field updated successfully");
    } catch (error) {
      console.error("Error updating default field:", error);
      toast.error("Failed to update default display field");
    } finally {
      setIsUpdating(false);
    }
  };
  
  // If no eligible fields exist
  if (eligibleFields.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-muted/30 p-4 rounded-md mb-4">
      <h3 className="text-sm font-medium mb-2">Default Display Field</h3>
      <div className="flex items-center gap-2">
        <Select value={selectedField} onValueChange={setSelectedField}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select a field to use as display name" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {eligibleFields.map((field) => (
                <SelectItem key={field.api_name} value={field.api_name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <Button
          onClick={handleSaveDefaultField}
          disabled={isUpdating || selectedField === objectType.default_field_api_name}
          size="sm"
          variant="outline"
        >
          {isUpdating ? 
            "Saving..." : 
            selectedField === objectType.default_field_api_name ? 
              <Check className="h-4 w-4" /> : 
              "Save"
          }
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        This field will be used as the display name for records of this object type.
      </p>
    </div>
  );
}
