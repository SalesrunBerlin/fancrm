
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useObjectLookup } from "@/hooks/useObjectLookup";
import { Loader2 } from "lucide-react";

interface LookupFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  targetObjectTypeId: string;
  disabled?: boolean;
}

export function LookupField({ 
  value, 
  onChange, 
  targetObjectTypeId,
  disabled 
}: LookupFieldProps) {
  const { records, isLoading } = useObjectLookup(targetObjectTypeId);

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <Select
      value={value || ""}
      onValueChange={(value) => onChange(value || null)}
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
