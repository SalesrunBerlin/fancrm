
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

  return (
    <Select
      value={value}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {records?.map((record) => (
          <SelectItem key={record.id} value={record.id}>
            {record.display_value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
