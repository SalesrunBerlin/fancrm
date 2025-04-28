
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

type Option = { id: string; name: string };

export function ActivityDealSelect({ value, onChange, disabled }: {
  value: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [deals, setDeals] = useState<Option[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // The Deals filter already works correctly, but I'm updating for consistency
      supabase.from("deals")
        .select("id,name")
        .eq("owner_id", user.id)
        .then(({ data }) => {
          setDeals(data || []);
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
