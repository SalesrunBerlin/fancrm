
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useObjectLookup } from "@/hooks/useObjectLookup";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const { records, isLoading, error } = useObjectLookup(targetObjectTypeId);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(value);
  
  useEffect(() => {
    setSelectedRecord(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setSelectedRecord(newValue || null);
    onChange(newValue || null);
  };
  
  if (!targetObjectTypeId) {
    return (
      <Alert variant="destructive" className="p-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Missing target object configuration</AlertDescription>
      </Alert>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="p-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading lookup data</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <div className="flex items-center space-x-2 h-10 px-3">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>;
  }

  return (
    <Select
      value={selectedRecord || ""}
      onValueChange={handleChange}
      disabled={disabled || !records || records.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={records && records.length > 0 ? "Select..." : "No records available"} />
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
