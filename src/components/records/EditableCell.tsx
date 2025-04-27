
import { useState, useEffect } from "react";
import { TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditableCellProps {
  value: any;
  onChange: (value: any) => void;
  editMode: boolean;
  fieldType: string;
  isRequired: boolean;
}

export function EditableCell({ value, onChange, editMode, fieldType, isRequired }: EditableCellProps) {
  const [editValue, setEditValue] = useState<any>(value);
  const [error, setError] = useState<string | null>(null);

  // Update local state when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleChange = (newValue: any) => {
    setEditValue(newValue);
    
    // Basic validation
    if (isRequired && (newValue === "" || newValue === null || newValue === undefined)) {
      setError("This field is required");
    } else {
      setError(null);
      onChange(newValue);
    }
  };

  if (!editMode) {
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
        // Just a simple example for picklist, in real app you'd need to get options from field definition
        return (
          <Select 
            value={editValue || ""} 
            onValueChange={handleChange}
          >
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
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
