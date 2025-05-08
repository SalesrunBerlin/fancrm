
import { Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useObjectLookup } from "@/hooks/useObjectLookup";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";

interface LookupValueDisplayProps {
  value: string | null;
  fieldOptions: {
    target_object_type_id: string;
    display_field_api_name?: string;
    description?: string;
  };
}

export function LookupValueDisplay({ value, fieldOptions }: LookupValueDisplayProps) {
  const targetObjectTypeId = fieldOptions.target_object_type_id;
  
  // Ensure we have a valid target object type ID
  if (!targetObjectTypeId) {
    console.error("Missing target object type ID in field options");
    return <span>Invalid configuration</span>;
  }
  
  const { records, isLoading, error } = useObjectLookup(targetObjectTypeId);
  
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
    return <span>{value} (Record not found)</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            to={`/objects/${targetObjectTypeId}/${value}`}
            className="text-blue-600 hover:underline"
          >
            {record.display_value}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>View record details</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
