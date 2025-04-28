
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

type Option = { id: string; name: string };

export function ActivityDealSelect({ value, onChange, disabled = false }: {
  value: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [deals, setDeals] = useState<Option[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Load deals from object_records table using the deal object type
      supabase
        .from("object_records")
        .select(`
          id,
          field_values:object_field_values(field_api_name, value)
        `)
        .eq("object_type_id", "deal_object_type_id") // Replace with actual deal object type ID
        .eq("owner_id", user.id)
        .then(({ data, error }) => {
          if (error) {
            console.error("Error loading deals:", error);
            return;
          }
          
          // Transform the data into Option format
          const transformedDeals = data?.map(record => ({
            id: record.id,
            name: record.field_values.find((f: any) => f.field_api_name === "name")?.value || "Unnamed Deal"
          })) || [];
          
          setDeals(transformedDeals);
        });
    }
  }, [user]);
  
  return (
    <Select value={value || ""} onValueChange={v => onChange(v === "none" ? null : v)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Deal verbinden" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Kein Deal</SelectItem>
        {deals.map(d => (
          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
