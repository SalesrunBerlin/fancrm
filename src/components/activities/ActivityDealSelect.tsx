
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type Option = { id: string; name: string };

export function ActivityDealSelect({ value, onChange, disabled }: {
  value: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [deals, setDeals] = useState<Option[]>([]);
  useEffect(() => {
    supabase.from("deals").select("id,name").then(({ data }) => {
      setDeals(data || []);
    });
  }, []);
  return (
    <Select value={value || ""} onValueChange={v => onChange(v || null)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Deal verbinden" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Kein Deal</SelectItem>
        {deals.map(d => (
          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
