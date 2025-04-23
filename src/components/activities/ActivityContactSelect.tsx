
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

type Option = { id: string; first_name: string; last_name: string };

export function ActivityContactSelect({ value, onChange, disabled }: {
  value: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [contacts, setContacts] = useState<Option[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Filter contacts by owner_id to only show contacts owned by the current user
      supabase.from("contacts")
        .select("id,first_name,last_name")
        .eq("owner_id", user.id)
        .then(({ data }) => {
          setContacts(data || []);
        });
    }
  }, [user]);

  return (
    <Select value={value || ""} onValueChange={v => onChange(v === "none" ? null : v)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Kontakt verbinden" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Kein Kontakt</SelectItem>
        {contacts.map(c => (
          <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
