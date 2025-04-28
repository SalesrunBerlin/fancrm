
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchData } from "@/lib/mockData";

interface Option {
  id: string;
  name: string;
}

interface ActivityAccountSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function ActivityAccountSelect({ value, onChange }: ActivityAccountSelectProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      setIsLoading(true);
      try {
        const accounts = await fetchData("accounts", "id, name");
        setOptions(accounts as Option[]);
      } catch (error) {
        console.error("Error loading accounts:", error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, []);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Account auswählen" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Lädt...
          </SelectItem>
        ) : options.length === 0 ? (
          <SelectItem value="none" disabled>
            Keine Accounts verfügbar
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
