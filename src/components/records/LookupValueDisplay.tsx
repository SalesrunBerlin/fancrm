
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useObjectLookup } from "@/hooks/useObjectLookup";
import { useObjectFields } from "@/hooks/useObjectFields";

interface LookupValueDisplayProps {
  value: string | null;
  fieldOptions: {
    target_object_type_id: string;
  };
}

export function LookupValueDisplay({ value, fieldOptions }: LookupValueDisplayProps) {
  const { records, isLoading } = useObjectLookup(fieldOptions.target_object_type_id);
  
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (!value) return <span>-</span>;

  const record = records?.find(r => r.id === value);
  
  if (!record) return <span>{value}</span>;

  return (
    <Link 
      to={`/objects/${fieldOptions.target_object_type_id}/${value}`}
      className="text-blue-600 hover:underline"
    >
      {record.display_value}
    </Link>
  );
}
