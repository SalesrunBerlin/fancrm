
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type Option = { id: string; name: string };

export function ActivityAccountSelect({ value, onChange, disabled }: {
  value: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [accounts, setAccounts] = useState<Option[]>([]);
  useEffect(() => {
    supabase.from("accounts").select("id,name").then(({ data }) => {
      setAccounts(data || []);
    });
  }, []);
  return (
    <Select value={value || ""} onValueChange={v => onChange(v || null)} disabled={disabled}>
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
