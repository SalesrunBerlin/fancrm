
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useObjectLookup } from "@/hooks/useObjectLookup";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface LookupFieldProps {
  value?: string;
  onChange: (value: string) => void;
  targetObjectTypeId: string;
  disabled?: boolean;
}

export function LookupField({
  value,
  onChange,
  targetObjectTypeId,
  disabled = false
}: LookupFieldProps) {
  const { records, isLoading } = useObjectLookup(targetObjectTypeId);
  
  useEffect(() => {
    console.log("Available lookup records:", records);
    console.log("Currently selected value:", value);
  }, [records, value]);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  const handleChange = (newValue: string) => {
    console.log("LookupField value changed:", newValue);
    onChange(newValue);
  };

  // Clear the lookup value
  const clearLookupValue = () => {
    console.log("Clearing lookup value");
    onChange("");
  };

  return (
    <div className="relative">
      <Select
        value={value || ""}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className="bg-white dark:bg-slate-900">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-slate-900 z-50">
          {records?.map((record) => (
            <SelectItem key={record.id} value={record.id}>
              {record.display_value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Clear button - only show if there's a value and not disabled */}
      {value && !disabled && (
        <Button 
          type="button"
          variant="ghost" 
          size="icon" 
          className="absolute right-0 top-0 h-full"
          onClick={clearLookupValue}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      )}
    </div>
  );
}
