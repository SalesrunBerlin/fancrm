
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

type Option = { id: string; name: string };

export function ActivityAccountSelect({ value, onChange, disabled = false }: {
  value: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [accounts, setAccounts] = useState<Option[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Load accounts from object_records table using the account object type
      supabase
        .from("object_records")
        .select(`
          id,
          field_values:object_field_values(field_api_name, value)
        `)
        .eq("object_type_id", "account_object_type_id") // Replace with actual account object type ID
        .eq("owner_id", user.id)
        .then(({ data, error }) => {
          if (error) {
            console.error("Error loading accounts:", error);
            return;
          }
          
          // Transform the data into Option format
          const transformedAccounts = data?.map(record => ({
            id: record.id,
            name: record.field_values.find((f: any) => f.field_api_name === "name")?.value || "Unnamed Account"
          })) || [];
          
          setAccounts(transformedAccounts);
        });
    }
  }, [user]);

  return (
    <Select value={value || ""} onValueChange={v => onChange(v === "none" ? null : v)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Account verbinden" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Kein Account</SelectItem>
        {accounts.map(a => (
          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
