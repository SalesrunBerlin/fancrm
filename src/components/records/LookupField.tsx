
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
    console.log("LookupField - targetObjectTypeId:", targetObjectTypeId);
    console.log("LookupField - Available lookup records:", records);
    console.log("LookupField - Currently selected value:", value);
  }, [records, value, targetObjectTypeId]);

  if (!targetObjectTypeId) {
    console.error("LookupField: No targetObjectTypeId provided");
    return <div className="text-red-500">Error: Missing target object configuration</div>;
  }

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
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className="bg-background w-full">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border shadow-md min-w-[200px]">
          {records?.length ? (
            records.map((record) => (
              <SelectItem key={record.id} value={record.id} className="bg-popover">
                {record.display_value || record.id}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-muted-foreground">
              No records available
            </div>
          )}
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
