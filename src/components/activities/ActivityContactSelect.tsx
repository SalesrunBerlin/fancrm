
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

type Option = { id: string; name: string };

export function ActivityContactSelect({ value, onChange, disabled = false }: {
  value: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [contacts, setContacts] = useState<Option[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Load contacts from object_records table using the contact object type
      supabase
        .from("object_records")
        .select(`
          id,
          field_values:object_field_values(field_api_name, value)
        `)
        .eq("object_type_id", "contact_object_type_id") // Replace with actual contact object type ID
        .eq("owner_id", user.id)
        .then(({ data, error }) => {
          if (error) {
            console.error("Error loading contacts:", error);
            return;
          }
          
          // Transform the data into Option format
          const transformedContacts = data?.map(record => ({
            id: record.id,
            name: [
              record.field_values.find((f: any) => f.field_api_name === "first_name")?.value,
              record.field_values.find((f: any) => f.field_api_name === "last_name")?.value
            ].filter(Boolean).join(" ") || "Unnamed Contact"
          })) || [];
          
          setContacts(transformedContacts);
        });
    }
  }, [user]);

  return (
    <Select value={value || ""} onValueChange={v => onChange(v === "none" ? null : v)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Contact verbinden" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Kein Contact</SelectItem>
        {contacts.map(c => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
