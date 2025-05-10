import { useState, useEffect } from "react";
import { TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LookupField } from "./LookupField";
import { LookupValueDisplay } from "./LookupValueDisplay";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { Loader2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { DatePickerField } from "@/components/ui/date-picker-field";

interface EditableCellProps {
  value: any;
  onChange: (value: any) => void;
  editMode: boolean;
  fieldType: string;
  isRequired: boolean;
  fieldOptions?: any;
  fieldId?: string;
}

export function EditableCell({ 
  value, 
  onChange, 
  editMode, 
  fieldType, 
  isRequired,
  fieldOptions,
  fieldId
}: EditableCellProps) {
  const [editValue, setEditValue] = useState<any>(value);
  const [error, setError] = useState<string | null>(null);
  const { picklistValues, isLoading: loadingPicklist } = useFieldPicklistValues(fieldId || fieldOptions?.field_id || '');

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleChange = (newValue: any) => {
    console.log(`EditableCell: Value changed for ${fieldType}:`, newValue);
    setEditValue(newValue);
    
    if (isRequired && (newValue === "" || newValue === null || newValue === undefined)) {
      setError("This field is required");
    } else {
      setError(null);
      onChange(newValue);
    }
  };

  const clearPicklistValue = () => {
    if (isRequired) {
      setError("This field is required");
      return;
    }
    console.log("Clearing picklist value");
    setEditValue(null);
    onChange(null);
    setError(null);
  };

  if (!editMode) {
    if (fieldType === 'lookup' && fieldOptions?.target_object_type_id) {
      return (
        <TableCell>
          <LookupValueDisplay 
            value={value} 
            fieldOptions={fieldOptions}
          />
        </TableCell>
      );
    }
    
    if (fieldType === 'picklist' && picklistValues) {
      const selectedOption = picklistValues.find(option => option.value === value);
      return <TableCell>{selectedOption?.label || value || "-"}</TableCell>;
    }
    
    if (fieldType === 'date' && value) {
      return <TableCell>{formatDate(value)}</TableCell>;
    }
    
    if (fieldType === 'auto_number' && value) {
      return <TableCell className="font-medium">{value}</TableCell>;
    }
    
    if (fieldType === 'rich_text' || fieldType === 'long_text') {
      return (
        <TableCell>
          <div className="max-h-20 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: value || '' }} />
          </div>
        </TableCell>
      );
    }
    
    return <TableCell>{value || "-"}</TableCell>;
  }

  const renderEditControl = () => {
    switch (fieldType) {
      case "textarea":
        return (
          <Textarea 
            value={editValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        );
      case "rich_text":
      case "long_text":
        return (
          <RichTextEditor 
            value={editValue || ""} 
            onChange={handleChange}
            minHeight="150px"
          />
        );
      case "picklist":
        if (loadingPicklist) {
          return (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading options...</span>
            </div>
          );
        }
        
        return (
          <div className="relative">
            <Select 
              value={editValue || ""} 
              onValueChange={handleChange}
              onOpenChange={(open) => {
                // Ensure we re-render when select opens to refresh picklist values
                if (open) console.log("Opening picklist select")
              }}
            >
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {picklistValues?.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editValue && (
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full"
                onClick={clearPicklistValue}
                disabled={isRequired}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear selection</span>
              </Button>
            )}
          </div>
        );
      case "boolean":
        return (
          <Select 
            value={String(!!editValue)} 
            onValueChange={(val) => handleChange(val === "true")}
          >
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      case "date":
        return (
          <DatePickerField
            value={editValue}
            onChange={handleChange}
            className={error ? "border-red-500" : ""}
            isDateTime={false}
          />
        );
      case "datetime":
        return (
          <DatePickerField
            value={editValue}
            onChange={handleChange}
            className={error ? "border-red-500" : ""}
            isDateTime={true}
          />
        );
      case "number":
      case "currency":
        return (
          <Input 
            type="number"
            value={editValue || ""}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
            className={error ? "border-red-500" : ""}
            step={fieldType === "currency" ? "0.01" : "1"}
          />
        );
      case "email":
        return (
          <Input 
            type="email"
            value={editValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        );
      case "url":
        return (
          <Input 
            type="url"
            value={editValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        );
      case "text":
      case "lookup":
        if (fieldType === "lookup" && !fieldOptions?.target_object_type_id) return null;
        
        if (fieldType === "lookup") {
          return (
            <LookupField
              value={value}
              onChange={handleChange}
              targetObjectTypeId={fieldOptions.target_object_type_id}
              disabled={false}
            />
          );
        }
        
        return (
          <Input 
            type="text"
            value={editValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        );
      case "auto_number":
        return (
          <Input 
            type="text"
            value={editValue || ""}
            placeholder="Auto-generated upon save"
            disabled={true}
            className="bg-muted cursor-not-allowed"
            title="This value will be automatically generated when the record is saved"
          />
        );
      default:
        return (
          <Input 
            type="text"
            value={editValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        );
    }
  };

  return (
    <TableCell>
      <div className="relative">
        {renderEditControl()}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    </TableCell>
  );
}
