import { useState, useEffect } from "react";
import { TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LookupField } from "./LookupField";
import { LookupValueDisplay } from "./LookupValueDisplay";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EditableCellProps {
  value: any;
  onChange: (value: any) => void;
  editMode: boolean;
  fieldType: string;
  isRequired: boolean;
  fieldOptions?: any;
}

export function EditableCell({ 
  value, 
  onChange, 
  editMode, 
  fieldType, 
  isRequired,
  fieldOptions
}: EditableCellProps) {
  const [editValue, setEditValue] = useState<any>(value);
  const [error, setError] = useState<string | null>(null);
  const { picklistValues, isLoading: loadingPicklist } = useFieldPicklistValues(fieldOptions?.field_id || '');

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleChange = (newValue: any) => {
    setEditValue(newValue);
    
    if (isRequired && (newValue === "" || newValue === null || newValue === undefined)) {
      setError("This field is required");
    } else {
      setError(null);
      onChange(newValue);
    }
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
          <Select 
            value={editValue || ""} 
            onValueChange={handleChange}
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
      case "datetime":
        return (
          <Input 
            type={fieldType === "date" ? "date" : "datetime-local"}
            value={editValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? "border-red-500" : ""}
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
