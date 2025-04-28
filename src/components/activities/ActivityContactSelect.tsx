
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchData } from "@/lib/mockData";

interface Option {
  id: string;
  first_name?: string;
  last_name?: string;
}

interface ActivityContactSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function ActivityContactSelect({ value, onChange }: ActivityContactSelectProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      setIsLoading(true);
      try {
        const contacts = await fetchData("contacts", "id, first_name, last_name");
        setOptions(contacts as Option[]);
      } catch (error) {
        console.error("Error loading contacts:", error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadContacts();
  }, []);

  const getContactName = (contact: Option) => {
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name} ${contact.last_name}`;
    } else if (contact.first_name) {
      return contact.first_name;
    } else if (contact.last_name) {
      return contact.last_name;
    }
    return "Unnamed Contact";
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Kontakt auswählen" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Lädt...
          </SelectItem>
        ) : options.length === 0 ? (
          <SelectItem value="none" disabled>
            Keine Kontakte verfügbar
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {getContactName(option)}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
