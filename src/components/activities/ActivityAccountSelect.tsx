
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

type Option = { id: string; name: string };

export function ActivityAccountSelect({ value, onChange, disabled }: {
  value: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [accounts, setAccounts] = useState<Option[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Filter accounts by owner_id to only show accounts owned by the current user
      supabase.from("accounts")
        .select("id,name")
        .eq("owner_id", user.id)
        .then(({ data }) => {
          setAccounts(data || []);
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
