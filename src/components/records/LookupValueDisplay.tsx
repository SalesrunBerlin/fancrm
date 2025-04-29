
import { Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useObjectLookup } from "@/hooks/useObjectLookup";
import { useIsMobile } from "@/hooks/use-mobile";

interface LookupValueDisplayProps {
  value: string | null;
  fieldOptions: {
    target_object_type_id?: string;
  };
}

export function LookupValueDisplay({ value, fieldOptions }: LookupValueDisplayProps) {
  const isMobile = useIsMobile();
  
  // Handle missing target object type ID
  if (!fieldOptions?.target_object_type_id) {
    return <div className="text-amber-500 flex items-center gap-1">
      <AlertCircle className="h-4 w-4" />
      <span>Missing target object configuration</span>
    </div>;
  }

  const { records, isLoading, error } = useObjectLookup(fieldOptions.target_object_type_id);
  
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  
  if (error) {
    console.error("Error in LookupValueDisplay:", error);
    return <div className="text-red-500 flex items-center gap-1">
      <AlertCircle className="h-4 w-4" />
      <span>Error loading record</span>
    </div>;
  }

  if (!value) return <span>-</span>;

  const record = records?.find(r => r.id === value);
  
  if (!record) {
    console.log("Record not found for ID:", value);
    return <span className="break-all">
      {isMobile && value.length > 15 ? `${value.substring(0, 15)}...` : value} 
      <span className="text-muted-foreground">(Record not found)</span>
    </span>;
  }

  return (
    <Link 
      to={`/objects/${fieldOptions.target_object_type_id}/${value}`}
      className="text-blue-600 hover:underline break-words"
    >
      {record.display_value}
    </Link>
  );
}
